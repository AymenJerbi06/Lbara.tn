const pool = require('../config/db');
const audit = require('../utils/audit');
const { generateOrderRef } = require('../utils/orderRef');
const emailService = require('../services/emailService');
const paymentService = require('../services/paymentService');

async function create(req, res) {
  const { product_id, delivery_email, delivery_phone, payment_method, promo_code } = req.body;

  if (!product_id || !delivery_email) {
    return res.status(400).json({ success: false, message: 'Product and delivery email are required.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(delivery_email)) {
    return res.status(400).json({ success: false, message: 'Invalid delivery email address.' });
  }
  if (typeof product_id !== 'string' || !/^[0-9a-f-]{36}$/.test(product_id)) {
    return res.status(400).json({ success: false, message: 'Invalid product.' });
  }

  try {
    // Load product
    const productResult = await pool.query('SELECT * FROM products WHERE id = $1 AND active = TRUE', [product_id]);
    const product = productResult.rows[0];
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    // Fraud: max 5 pending orders per IP in 24h
    const fraudCheck = await pool.query(
      `SELECT COUNT(*) FROM orders WHERE ip_address = $1 AND status IN ('pending_payment','paid','processing')
       AND created_at > NOW() - INTERVAL '24 hours'`,
      [req.ip]
    );
    if (parseInt(fraudCheck.rows[0].count) >= 5) {
      return res.status(429).json({ success: false, message: 'Too many pending orders. Please contact support.' });
    }

    let amount = parseFloat(product.price_tnd);
    let discount = 0;

    // Basic promo code logic (extend as needed)
    if (promo_code && promo_code.toUpperCase() === 'LBARA10') {
      discount = parseFloat((amount * 0.10).toFixed(3));
      amount = parseFloat((amount - discount).toFixed(3));
    }

    const orderRef = generateOrderRef();
    const gateway = process.env.PAYMENT_GATEWAY || 'flouci';

    const orderResult = await pool.query(
      `INSERT INTO orders (order_ref, user_id, product_id, amount_tnd, gateway, delivery_email, delivery_phone, promo_code, discount_tnd, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        orderRef,
        req.user?.id || null,
        product_id,
        product.price_tnd,
        gateway,
        delivery_email.toLowerCase(),
        delivery_phone || null,
        promo_code || null,
        discount,
        req.ip,
        req.headers['user-agent'],
      ]
    );
    const order = orderResult.rows[0];

    // Create payment session with gateway
    const paymentSession = await paymentService.createPayment({
      orderId: order.id,
      orderRef: order.order_ref,
      amount: amount,
      gateway,
    });

    // Save gateway payment ID
    await pool.query(
      'UPDATE orders SET gateway_payment_id = $1 WHERE id = $2',
      [paymentSession.payment_id, order.id]
    );
    await pool.query(
      `INSERT INTO payments (order_id, gateway, gateway_payment_id, gateway_status) VALUES ($1, $2, $3, 'initiated')`,
      [order.id, gateway, paymentSession.payment_id]
    );

    await audit.log({ entityType: 'order', entityId: order.id, action: 'created', actorId: req.user?.id, actorType: req.user ? 'user' : 'guest', metadata: { order_ref: orderRef, product: product.name } });

    res.status(201).json({
      success: true,
      order_id: order.id,
      order_ref: order.order_ref,
      payment_url: paymentSession.payment_url,
    });
  } catch (err) {
    console.error('[orders/create]', err);
    res.status(500).json({ success: false, message: 'Failed to create order. Please try again.' });
  }
}

async function getOrder(req, res) {
  try {
    const result = await pool.query(
      `SELECT o.*, p.name AS product_name, p.provider, p.category, p.account_type, p.duration_label
       FROM orders o
       JOIN products p ON p.id = o.product_id
       WHERE o.id = $1`,
      [req.params.id]
    );
    const order = result.rows[0];
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    // Only order owner or admin can view
    if (req.user && !req.user.is_admin && order.user_id && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch order.' });
  }
}

async function myOrders(req, res) {
  try {
    const result = await pool.query(
      `SELECT o.*, p.name AS product_name, p.provider, p.category
       FROM orders o
       JOIN products p ON p.id = o.product_id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, orders: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
}

module.exports = { create, getOrder, myOrders };
