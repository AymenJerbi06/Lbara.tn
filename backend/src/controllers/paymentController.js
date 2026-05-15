const pool = require('../config/db');
const paymentService = require('../services/paymentService');
const emailService = require('../services/emailService');
const audit = require('../utils/audit');
const {
  cleanUuid,
  cleanString,
  requirePlainObject,
  rejectUnexpectedFields,
  handleValidationError,
} = require('../utils/validation');

// Called by the client after returning from payment page, or by admin to manually verify.
async function verify(req, res) {
  try {
    const order_id = cleanUuid(req.params.order_id, { label: 'Order' });
    const orderResult = await pool.query(
      `SELECT o.*, p.name AS product_name, p.provider, p.delivery_hours, p.duration_label
       FROM orders o JOIN products p ON p.id = o.product_id
       WHERE o.id = $1`,
      [order_id]
    );
    const order = orderResult.rows[0];
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (req.user && !req.user.is_admin && order.user_id && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    if (order.status === 'paid' || order.status === 'fulfilled') {
      return res.json({ success: true, status: order.status, order_ref: order.order_ref });
    }
    if (!order.gateway_payment_id) {
      return res.status(400).json({ success: false, message: 'No payment session found for this order.' });
    }

    const verification = await paymentService.verifyPayment({
      gateway: order.gateway,
      paymentId: order.gateway_payment_id,
    });

    await pool.query(
      `UPDATE payments SET gateway_status = $1, raw_response = $2, verified_at = NOW()
       WHERE order_id = $3 AND gateway_payment_id = $4`,
      [verification.success ? 'SUCCESS' : 'FAILED', JSON.stringify(verification.raw), order.id, order.gateway_payment_id]
    );

    if (verification.success) {
      await pool.query(`UPDATE orders SET status = 'paid', updated_at = NOW() WHERE id = $1`, [order.id]);
      await audit.log({ entityType: 'order', entityId: order.id, action: 'payment_verified', actorType: 'system' });
      console.log(`[INFO] Payment verified for order ${order.order_ref} (${order.id})`);

      try {
        await emailService.sendOrderConfirmation(order, {
          name: order.product_name,
          duration_label: order.duration_label,
          delivery_hours: order.delivery_hours,
        });
        console.log(`[INFO] Confirmation email sent to ${order.delivery_email} for order ${order.order_ref}`);
      } catch (emailErr) {
        console.error(`[ERROR] Confirmation email failed for order ${order.order_ref}:`, emailErr.message);
      }

      try {
        await emailService.sendInternalOrderNotification(order, {
          name: order.product_name,
        });
      } catch (emailErr) {
        console.error(`[ERROR] Internal order notification failed for order ${order.order_ref}:`, emailErr.message);
      }

      return res.json({ success: true, status: 'paid', order_ref: order.order_ref });
    }

    console.log(`[WARN] Payment not verified for order ${order.order_ref}`);
    return res.json({ success: false, status: order.status, message: 'Payment has not been verified yet.' });
  } catch (err) {
    if (handleValidationError(err, res)) return;
    console.error('[payment/verify]', err);
    res.status(500).json({ success: false, message: 'Payment verification failed.' });
  }
}

async function webhookFlouci(req, res) {
  try {
    requirePlainObject(req.body, 'Webhook');
    rejectUnexpectedFields(req.body, ['payment_id'], 'Flouci webhook');
    const payment_id = cleanString(req.body.payment_id, { label: 'Payment id', required: true, max: 255 });
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE gateway_payment_id = $1',
      [payment_id]
    );
    const order = orderResult.rows[0];
    if (!order) return res.status(404).json({ success: false });

    const verification = await paymentService.verifyPayment({ gateway: 'flouci', paymentId: payment_id });
    await pool.query(
      `UPDATE payments SET gateway_status = $1, raw_response = $2, verified_at = NOW()
       WHERE order_id = $3`,
      [verification.success ? 'SUCCESS' : 'FAILED', JSON.stringify(verification.raw), order.id]
    );

    if (verification.success && order.status === 'pending_payment') {
      await pool.query(`UPDATE orders SET status = 'paid', updated_at = NOW() WHERE id = $1`, [order.id]);
      await audit.log({ entityType: 'order', entityId: order.id, action: 'paid_via_webhook', actorType: 'system' });
      console.log(`[INFO] Flouci webhook marked order ${order.order_ref} paid`);
    }
    res.json({ success: true });
  } catch (err) {
    if (handleValidationError(err, res)) return;
    console.error('[ERROR] webhook/flouci:', err.message);
    res.status(500).json({ success: false });
  }
}

async function webhookPaymee(req, res) {
  try {
    requirePlainObject(req.body, 'Webhook');
    const token = cleanString(req.body.token, { label: 'Payment token', required: true, max: 255 });
    const payment_status = req.body.payment_status === true;
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE gateway_payment_id = $1',
      [token]
    );
    const order = orderResult.rows[0];
    if (!order) return res.status(404).json({ success: false });

    const verification = await paymentService.verifyPayment({ gateway: 'paymee', paymentId: token });
    await pool.query(
      `UPDATE payments SET gateway_status = $1, raw_response = $2, verified_at = NOW()
       WHERE order_id = $3`,
      [verification.success ? 'SUCCESS' : 'FAILED', JSON.stringify(verification.raw || req.body), order.id]
    );

    if (payment_status === true && verification.success && order.status === 'pending_payment') {
      await pool.query(`UPDATE orders SET status = 'paid', updated_at = NOW() WHERE id = $1`, [order.id]);
      await audit.log({ entityType: 'order', entityId: order.id, action: 'paid_via_webhook', actorType: 'system' });
      console.log(`[INFO] Paymee webhook marked order ${order.order_ref} paid`);
    }
    res.json({ success: true });
  } catch (err) {
    if (handleValidationError(err, res)) return;
    console.error('[ERROR] webhook/paymee:', err.message);
    res.status(500).json({ success: false });
  }
}

module.exports = { verify, webhookFlouci, webhookPaymee };
