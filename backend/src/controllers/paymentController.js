const pool = require('../config/db');
const paymentService = require('../services/paymentService');
const emailService = require('../services/emailService');
const audit = require('../utils/audit');
const { decrypt } = require('../utils/crypto');
const {
  normalizeFulfillmentType,
  getFulfillmentTypeLabel,
  getFulfillmentMethodLabel,
} = require('../utils/fulfillment');
const {
  cleanUuid,
  cleanString,
  requirePlainObject,
  rejectUnexpectedFields,
  handleValidationError,
} = require('../utils/validation');

async function loadOrderForPayment(orderId) {
  const orderResult = await pool.query(
    `SELECT o.*, p.name AS product_name, p.provider, p.delivery_hours, p.duration_label,
            p.fulfillment_type AS product_fulfillment_type,
            v.name AS variant_name, v.billing_period AS variant_billing_period,
            v.checkout_mode AS variant_checkout_mode
     FROM orders o
     JOIN products p ON p.id = o.product_id
     LEFT JOIN product_variants v ON v.id = o.variant_id
     WHERE o.id = $1`,
    [orderId]
  );
  return orderResult.rows[0];
}

function decorateOrderForEmail(order) {
  const fulfillmentType = normalizeFulfillmentType(order.fulfillment_type || order.product_fulfillment_type);
  let fulfillmentDetails = {};

  if (order.fulfillment_details) {
    try {
      fulfillmentDetails = JSON.parse(decrypt(order.fulfillment_details));
    } catch {
      fulfillmentDetails = { note: 'Could not decrypt fulfillment details for this email.' };
    }
  }

  return {
    ...order,
    fulfillment_type: fulfillmentType,
    fulfillment_type_label: getFulfillmentTypeLabel(fulfillmentType),
    fulfillment_method_label: getFulfillmentMethodLabel(order.fulfillment_method),
    fulfillment_details_decoded: fulfillmentDetails,
  };
}

function productForOrderEmail(order) {
  return {
    name: order.variant_name ? `${order.product_name} - ${order.variant_name}` : order.product_name,
    duration_label: order.variant_billing_period || order.duration_label,
    delivery_hours: order.delivery_hours,
    variant_name: order.variant_name,
    checkout_mode: order.variant_checkout_mode,
    fulfillment_type_label: order.fulfillment_type_label,
    fulfillment_method_label: order.fulfillment_method_label,
  };
}

async function sendPaidOrderEmails(order) {
  const decorated = decorateOrderForEmail(order);
  const product = productForOrderEmail(decorated);

  try {
    await emailService.sendOrderConfirmation(decorated, product);
    console.log(`[INFO] Confirmation email sent to ${decorated.delivery_email} for order ${decorated.order_ref}`);
  } catch (emailErr) {
    console.error(`[ERROR] Confirmation email failed for order ${decorated.order_ref}:`, emailErr.message);
  }

  try {
    await emailService.sendInternalOrderNotification(decorated, product);
  } catch (emailErr) {
    console.error(`[ERROR] Internal order notification failed for order ${decorated.order_ref}:`, emailErr.message);
  }

  return decorated;
}

async function markOrderPaidAndNotify(order, action) {
  if (order.status !== 'paid' && order.status !== 'fulfilled') {
    await pool.query(`UPDATE orders SET status = 'paid', updated_at = NOW() WHERE id = $1`, [order.id]);
    order.status = 'paid';
    await audit.log({ entityType: 'order', entityId: order.id, action, actorType: 'system' });
    console.log(`[INFO] Payment verified for order ${order.order_ref} (${order.id})`);
    await sendPaidOrderEmails(order);
  }
  return order;
}

// Called by the client after returning from payment page, or by admin to manually verify.
async function verify(req, res) {
  try {
    const order_id = cleanUuid(req.params.order_id, { label: 'Order' });
    const order = await loadOrderForPayment(order_id);
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
    if (order.gateway === 'mock') {
      return res.json({ success: false, status: order.status, message: 'Complete the test card payment first.' });
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
      await markOrderPaidAndNotify(order, 'payment_verified');
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

async function submitTestCard(req, res) {
  try {
    requirePlainObject(req.body, 'Test card payment');
    rejectUnexpectedFields(req.body, ['cardholder_name', 'card_number', 'expiry', 'cvc', 'payment_id'], 'Test card payment');
    const order_id = cleanUuid(req.params.order_id, { label: 'Order' });
    const cardholderName = cleanString(req.body.cardholder_name, { label: 'Cardholder name', required: true, max: 120 });
    const cardNumber = cleanString(req.body.card_number, { label: 'Card number', required: true, max: 30 }).replace(/\D/g, '');
    const expiry = cleanString(req.body.expiry, { label: 'Expiry date', required: true, max: 10 }).replace(/\s/g, '');
    const cvc = cleanString(req.body.cvc, { label: 'CVC', required: true, max: 6 }).replace(/\D/g, '');
    const paymentId = cleanString(req.body.payment_id, { label: 'Payment id', required: false, max: 255 });

    const order = await loadOrderForPayment(order_id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (req.user && !req.user.is_admin && order.user_id && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (order.gateway !== 'mock') {
      return res.status(400).json({ success: false, message: 'This order is not using the test card payment portal.' });
    }
    if (paymentId && paymentId !== order.gateway_payment_id) {
      return res.status(400).json({ success: false, message: 'Payment session does not match this order.' });
    }
    if (order.status === 'paid' || order.status === 'fulfilled') {
      return res.json({ success: true, status: order.status, order_ref: order.order_ref });
    }

    const expectedCard = String(process.env.TEST_CARD_NUMBER || '4242424242424242').replace(/\D/g, '');
    const expectedCvc = String(process.env.TEST_CARD_CVC || '123').replace(/\D/g, '');
    if (cardNumber !== expectedCard || cvc !== expectedCvc || !/^\d{2}\/?\d{2}$/.test(expiry)) {
      await pool.query(
        `UPDATE payments SET gateway_status = 'FAILED', raw_response = $1, verified_at = NOW()
         WHERE order_id = $2 AND gateway_payment_id = $3`,
        [JSON.stringify({ gateway: 'test_card', status: 'DECLINED', last4: cardNumber.slice(-4) }), order.id, order.gateway_payment_id]
      );
      return res.status(402).json({ success: false, message: 'Test card declined. Use the approved test card details shown on the page.' });
    }

    const rawResponse = {
      gateway: 'test_card',
      status: 'SUCCESS',
      cardholder_name: cardholderName,
      last4: cardNumber.slice(-4),
      payment_id: order.gateway_payment_id,
    };

    await pool.query(
      `UPDATE payments SET gateway_status = 'SUCCESS', raw_response = $1, verified_at = NOW()
       WHERE order_id = $2 AND gateway_payment_id = $3`,
      [JSON.stringify(rawResponse), order.id, order.gateway_payment_id]
    );

    await markOrderPaidAndNotify(order, 'test_card_payment_verified');
    return res.json({ success: true, status: 'paid', order_ref: order.order_ref });
  } catch (err) {
    if (handleValidationError(err, res)) return;
    console.error('[payment/test-card]', err);
    res.status(500).json({ success: false, message: 'Test card payment failed.' });
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

module.exports = { verify, submitTestCard, webhookFlouci, webhookPaymee };
