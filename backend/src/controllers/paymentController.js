const pool = require('../config/db');
const paymentService = require('../services/paymentService');
const emailService = require('../services/emailService');
const audit = require('../utils/audit');

// Called by the client after returning from payment page, or by admin to manually verify
async function verify(req, res) {
  const { order_id } = req.params;

  try {
    const orderResult = await pool.query(
      `SELECT o.*, p.name AS product_name, p.provider, p.delivery_hours, p.duration_label
       FROM orders o JOIN products p ON p.id = o.product_id
       WHERE o.id = $1`,
      [order_id]
    );
    const order = orderResult.rows[0];
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

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

    // Update payment record
    await pool.query(
      `UPDATE payments SET gateway_status = $1, raw_response = $2, verified_at = NOW()
       WHERE order_id = $3 AND gateway_payment_id = $4`,
      [verification.success ? 'SUCCESS' : 'FAILED', JSON.stringify(verification.raw), order.id, order.gateway_payment_id]
    );

    if (verification.success) {
      await pool.query(`UPDATE orders SET status = 'paid', updated_at = NOW() WHERE id = $1`, [order.id]);
      await audit.log({ entityType: 'order', entityId: order.id, action: 'payment_verified', actorType: 'system' });
      console.log(`[INFO] Payment verified — order ${order.order_ref} (${order.id})`);

      // Send order confirmation email
      try {
        await emailService.sendOrderConfirmation(order, {
          name: order.product_name,
          duration_label: order.duration_label,
          delivery_hours: order.delivery_hours,
        });
        console.log(`[INFO] Confirmation email sent — ${order.delivery_email} order ${order.order_ref}`);
      } catch (emailErr) {
        console.error(`[ERROR] Confirmation email failed for order ${order.order_ref}:`, emailErr.message);
      }

      return res.json({ success: true, status: 'paid', order_ref: order.order_ref });
    }

    await pool.query(`UPDATE orders SET status = 'payment_failed', updated_at = NOW() WHERE id = $1`, [order.id]);
    console.log(`[WARN] Payment failed — order ${order.order_ref}`);
    res.json({ success: false, status: 'payment_failed', message: 'Payment was not successful.' });
  } catch (err) {
    console.error('[payment/verify]', err);
    res.status(500).json({ success: false, message: 'Payment verification failed.' });
  }
}

// Webhook called by Flouci
async function webhookFlouci(req, res) {
  const { payment_id } = req.body;
  if (!payment_id) return res.status(400).json({ success: false });

  try {
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE gateway_payment_id = $1', [payment_id]
    );
    const order = orderResult.rows[0];
    if (!order) return res.status(404).json({ success: false });

    const verification = await paymentService.verifyPayment({ gateway: 'flouci', paymentId: payment_id });
    if (verification.success && order.status === 'pending_payment') {
      await pool.query(`UPDATE orders SET status = 'paid', updated_at = NOW() WHERE id = $1`, [order.id]);
      await pool.query(
        `UPDATE payments SET gateway_status = 'SUCCESS', raw_response = $1, verified_at = NOW()
         WHERE order_id = $2`,
        [JSON.stringify(verification.raw), order.id]
      );
      await audit.log({ entityType: 'order', entityId: order.id, action: 'paid_via_webhook', actorType: 'system' });
      console.log(`[INFO] Flouci webhook — order ${order.order_ref} marked paid`);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[ERROR] webhook/flouci:', err.message);
    res.status(500).json({ success: false });
  }
}

// Webhook called by Paymee
async function webhookPaymee(req, res) {
  const { token, payment_status } = req.body;
  if (!token) return res.status(400).json({ success: false });

  try {
    const orderResult = await pool.query(
      'SELECT * FROM orders WHERE gateway_payment_id = $1', [token]
    );
    const order = orderResult.rows[0];
    if (!order) return res.status(404).json({ success: false });

    if (payment_status === true && order.status === 'pending_payment') {
      await pool.query(`UPDATE orders SET status = 'paid', updated_at = NOW() WHERE id = $1`, [order.id]);
      await pool.query(
        `UPDATE payments SET gateway_status = 'SUCCESS', raw_response = $1, verified_at = NOW()
         WHERE order_id = $2`,
        [JSON.stringify(req.body), order.id]
      );
      await audit.log({ entityType: 'order', entityId: order.id, action: 'paid_via_webhook', actorType: 'system' });
      console.log(`[INFO] Paymee webhook — order ${order.order_ref} marked paid`);
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[ERROR] webhook/paymee:', err.message);
    res.status(500).json({ success: false });
  }
}

module.exports = { verify, webhookFlouci, webhookPaymee };
