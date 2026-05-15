const pool = require('../config/db');
const audit = require('../utils/audit');
const { generateOrderRef } = require('../utils/orderRef');
const emailService = require('../services/emailService');
const paymentService = require('../services/paymentService');
const { encrypt } = require('../utils/crypto');
const { normalizeFulfillmentForOrder } = require('../utils/fulfillment');
const {
  rejectUnexpectedFields,
  cleanEmail,
  cleanString,
  cleanUuid,
  cleanPhone,
  cleanEnum,
  cleanInteger,
  badRequest,
  handleValidationError,
} = require('../utils/validation');

const REVIEWABLE_STATUSES = ['paid', 'processing', 'fulfilled'];

async function create(req, res) {
  try {
    rejectUnexpectedFields(req.body, [
      'product_id',
      'variant_id',
      'delivery_email',
      'delivery_phone',
      'promo_code',
      'payment_method',
      'fulfillment_method',
      'fulfillment_details',
    ], 'Checkout');

    const product_id = cleanUuid(req.body.product_id, { label: 'Product' });
    const variant_id = cleanUuid(req.body.variant_id, { label: 'Product option', required: false });
    const delivery_email = cleanEmail(req.body.delivery_email, { label: 'Delivery email' });
    const delivery_phone = cleanPhone(req.body.delivery_phone);
    const promo_code = cleanString(req.body.promo_code, { label: 'Promo code', required: false, max: 50 });
    const payment_method = cleanEnum(req.body.payment_method || 'd17', ['d17', 'card'], { label: 'Payment method' });
    const fulfillment_method = cleanString(req.body.fulfillment_method, { label: 'Fulfillment method', required: false, max: 80 });
    if (req.body.fulfillment_details !== undefined && (typeof req.body.fulfillment_details !== 'object' || Array.isArray(req.body.fulfillment_details))) {
      throw badRequest('Fulfillment details must be an object.');
    }
    const fulfillment_details = req.body.fulfillment_details || {};

    // Load product
    const productResult = await pool.query('SELECT * FROM products WHERE id = $1 AND active = TRUE', [product_id]);
    const product = productResult.rows[0];
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const variantCountResult = await pool.query(
      'SELECT COUNT(*)::int AS count FROM product_variants WHERE product_id = $1 AND active = TRUE',
      [product_id]
    );
    const hasVariants = variantCountResult.rows[0].count > 0;
    let variant = null;

    if (hasVariants && !variant_id) {
      return res.status(400).json({ success: false, message: 'Please choose a product option before checkout.' });
    }

    if (variant_id) {
      const variantResult = await pool.query(
        'SELECT * FROM product_variants WHERE id = $1 AND product_id = $2 AND active = TRUE',
        [variant_id, product_id]
      );
      variant = variantResult.rows[0];
      if (!variant) return res.status(404).json({ success: false, message: 'Product option not found.' });
    }

    const fulfillment = normalizeFulfillmentForOrder(product, fulfillment_method, fulfillment_details || {});
    const encryptedFulfillmentDetails = encrypt(JSON.stringify(fulfillment.fulfillment_details));

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
    if (variant) {
      if (variant.checkout_mode === 'quote') {
        amount = variant.deposit_tnd === null || variant.deposit_tnd === undefined ? NaN : parseFloat(variant.deposit_tnd);
      } else {
        amount = variant.price_tnd === null || variant.price_tnd === undefined ? NaN : parseFloat(variant.price_tnd);
      }
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      const optionName = variant ? ` for ${variant.name}` : '';
      return res.status(409).json({
        success: false,
        message: `Pricing is not ready${optionName}. Please contact us before ordering this service.`,
      });
    }

    let discount = 0;
    let appliedPromoCode = null;

    if (promo_code) {
      const promoResult = await pool.query(
        `SELECT code, discount_percent
         FROM promo_codes
         WHERE UPPER(code) = UPPER($1) AND active = TRUE
         LIMIT 1`,
        [promo_code]
      );
      const promo = promoResult.rows[0];
      if (!promo) {
        return res.status(400).json({ success: false, message: 'Invalid promo code.' });
      }
      const discountPercent = Number(promo.discount_percent);
      discount = parseFloat((amount * (discountPercent / 100)).toFixed(3));
      amount = parseFloat(Math.max(0, amount - discount).toFixed(3));
      appliedPromoCode = promo.code;
    }

    const orderRef = generateOrderRef();
    const gateway = payment_method === 'card' || amount <= 0 ? 'mock' : (process.env.PAYMENT_GATEWAY || 'flouci');

    const orderResult = await pool.query(
      `INSERT INTO orders (order_ref, user_id, product_id, variant_id, amount_tnd, gateway, delivery_email, delivery_phone, fulfillment_type, fulfillment_method, fulfillment_details, promo_code, discount_tnd, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        orderRef,
        req.user?.id || null,
        product_id,
        variant?.id || null,
        amount,
        gateway,
        delivery_email,
        delivery_phone,
        fulfillment.fulfillment_type,
        fulfillment.fulfillment_method,
        encryptedFulfillmentDetails,
        appliedPromoCode,
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

    await audit.log({
      entityType: 'order',
      entityId: order.id,
      action: 'created',
      actorId: req.user?.id,
      actorType: req.user ? 'user' : 'guest',
      metadata: {
        order_ref: orderRef,
        product: product.name,
        variant: variant?.name || null,
        checkout_mode: variant?.checkout_mode || 'full_payment',
        payment_method,
      },
    });

    res.status(201).json({
      success: true,
      order_id: order.id,
      order_ref: order.order_ref,
      payment_url: paymentSession.payment_url,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    if (handleValidationError(err, res)) return;
    console.error('[orders/create]', err);
    res.status(500).json({ success: false, message: 'Failed to create order. Please try again.' });
  }
}

async function getOrder(req, res) {
  try {
    const id = cleanUuid(req.params.id, { label: 'Order' });
    const result = await pool.query(
      `SELECT o.*, p.name AS product_name, p.provider, p.category, p.account_type, p.duration_label,
              v.name AS variant_name, v.billing_period AS variant_billing_period, v.checkout_mode AS variant_checkout_mode
       FROM orders o
       JOIN products p ON p.id = o.product_id
       LEFT JOIN product_variants v ON v.id = o.variant_id
      WHERE o.id = $1`,
      [id]
    );
    const order = result.rows[0];
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    // Only order owner or admin can view full order details.
    if (!req.user.is_admin && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    delete order.fulfillment_details;
    res.json({ success: true, order });
  } catch (err) {
    if (handleValidationError(err, res)) return;
    res.status(500).json({ success: false, message: 'Failed to fetch order.' });
  }
}

async function myOrders(req, res) {
  try {
    const result = await pool.query(
      `SELECT o.*, p.name AS product_name, p.provider, p.category,
              v.name AS variant_name, v.billing_period AS variant_billing_period, v.checkout_mode AS variant_checkout_mode,
              r.id AS review_id, r.rating AS review_rating, r.comment AS review_comment, r.updated_at AS review_updated_at
       FROM orders o
       JOIN products p ON p.id = o.product_id
       LEFT JOIN product_variants v ON v.id = o.variant_id
       LEFT JOIN product_reviews r ON r.order_id = o.id AND r.user_id = $1
       WHERE o.user_id = $1
         AND o.status IN ('paid','processing','fulfilled','cancelled','refunded','flagged')
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    const orders = result.rows.map((order) => {
      delete order.fulfillment_details;
      return order;
    });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
}

async function reviewOrder(req, res) {
  try {
    const orderId = cleanUuid(req.params.id, { label: 'Order' });
    rejectUnexpectedFields(req.body, ['rating', 'comment'], 'Review');
    const rating = cleanInteger(req.body.rating, { label: 'Rating', min: 1, max: 5 });
    const comment = cleanString(req.body.comment, { label: 'Review comment', required: false, max: 800 });

    const orderResult = await pool.query(
      'SELECT id, user_id, product_id, status FROM orders WHERE id = $1',
      [orderId]
    );
    const order = orderResult.rows[0];
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only review your own purchases.' });
    }
    if (!REVIEWABLE_STATUSES.includes(order.status)) {
      return res.status(409).json({ success: false, message: 'You can review this service after the order is paid.' });
    }

    const result = await pool.query(
      `INSERT INTO product_reviews (user_id, order_id, product_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (order_id)
       DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, updated_at = NOW()
       RETURNING id, order_id, product_id, rating, comment, created_at, updated_at`,
      [req.user.id, order.id, order.product_id, rating, comment]
    );

    await audit.log({
      entityType: 'order',
      entityId: order.id,
      action: 'reviewed',
      actorId: req.user.id,
      actorType: 'user',
      metadata: { rating },
    });

    res.json({ success: true, review: result.rows[0] });
  } catch (err) {
    if (handleValidationError(err, res)) return;
    console.error('[orders/reviewOrder]', err);
    res.status(500).json({ success: false, message: 'Failed to save review.' });
  }
}

module.exports = { create, getOrder, myOrders, reviewOrder };
