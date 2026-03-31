const pool = require('../config/db');
const emailService = require('../services/emailService');
const audit = require('../utils/audit');
const { encrypt, decrypt } = require('../utils/crypto');

// ─── Orders ───────────────────────────────────────────────

async function listOrders(req, res) {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  let where = '';

  if (status) {
    params.push(status);
    where = `WHERE o.status = $1`;
  }

  params.push(parseInt(limit), offset);
  const limitIdx = params.length - 1;
  const offsetIdx = params.length;

  try {
    const result = await pool.query(
      `SELECT o.*, p.name AS product_name, p.provider, u.email AS user_email
       FROM orders o
       JOIN products p ON p.id = o.product_id
       LEFT JOIN users u ON u.id = o.user_id
       ${where}
       ORDER BY o.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    );
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM orders o ${where}`,
      params.slice(0, -2)
    );
    res.json({
      success: true,
      orders: result.rows,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (err) {
    console.error('[admin/orders]', err);
    res.status(500).json({ success: false, message: 'Failed to load orders.' });
  }
}

async function fulfillOrder(req, res) {
  const { id } = req.params;
  const { credentials, notes } = req.body;

  if (!credentials) {
    return res.status(400).json({ success: false, message: 'Credentials are required to fulfill.' });
  }

  try {
    const orderResult = await pool.query(
      `SELECT o.*, p.name AS product_name, p.provider, p.duration_label, p.delivery_hours
       FROM orders o JOIN products p ON p.id = o.product_id
       WHERE o.id = $1`,
      [id]
    );
    const order = orderResult.rows[0];
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Can only fulfill paid orders.' });
    }

    const encryptedCreds = encrypt(credentials);

    await pool.query(`UPDATE orders SET status = 'fulfilled', updated_at = NOW() WHERE id = $1`, [id]);
    await pool.query(
      `INSERT INTO fulfillments (order_id, status, credentials, notes, fulfilled_by, delivered_at)
       VALUES ($1, 'sent', $2, $3, $4, NOW())`,
      [id, encryptedCreds, notes || null, req.user.id]
    );

    await audit.log({ entityType: 'order', entityId: id, action: 'fulfilled', actorId: req.user.id, actorType: 'admin', metadata: { notes } });

    // Send delivery email (with plain credentials — not encrypted)
    try {
      await emailService.sendFulfillmentEmail(order, { name: order.product_name, duration_label: order.duration_label }, credentials);
    } catch (emailErr) {
      console.error('[admin/fulfill email]', emailErr.message);
    }

    res.json({ success: true, message: 'Order fulfilled and delivery email sent.' });
  } catch (err) {
    console.error('[admin/fulfill]', err);
    res.status(500).json({ success: false, message: 'Fulfillment failed.' });
  }
}

async function updateOrderStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ['processing', 'cancelled', 'refunded', 'flagged', 'paid'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }
  try {
    await pool.query(`UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`, [status, id]);
    await audit.log({ entityType: 'order', entityId: id, action: `status_changed_to_${status}`, actorId: req.user.id, actorType: 'admin' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
}

// ─── Products ─────────────────────────────────────────────

async function listProducts(req, res) {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json({ success: true, products: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load products.' });
  }
}

async function createProduct(req, res) {
  const { slug, name, provider, category, description, price_tnd, badge, account_type, duration_label, delivery_hours, image_url } = req.body;
  if (!slug || !name || !provider || !category || !price_tnd) {
    return res.status(400).json({ success: false, message: 'slug, name, provider, category, and price_tnd are required.' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO products (slug, name, provider, category, description, price_tnd, badge, account_type, duration_label, delivery_hours, image_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [slug, name, provider, category, description || null, price_tnd, badge || null, account_type || 'private', duration_label || '1 Month', delivery_hours || 2, image_url || null]
    );
    res.status(201).json({ success: true, product: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ success: false, message: 'A product with this slug already exists.' });
    res.status(500).json({ success: false, message: 'Failed to create product.' });
  }
}

async function updateProduct(req, res) {
  const { id } = req.params;
  const fields = ['name', 'provider', 'category', 'description', 'price_tnd', 'badge', 'account_type', 'duration_label', 'delivery_hours', 'active', 'image_url'];
  const updates = [];
  const values = [];

  fields.forEach((f) => {
    if (req.body[f] !== undefined) {
      values.push(req.body[f]);
      updates.push(`${f} = $${values.length}`);
    }
  });

  if (!updates.length) return res.status(400).json({ success: false, message: 'No fields to update.' });
  values.push(id);

  try {
    await pool.query(`UPDATE products SET ${updates.join(', ')} WHERE id = $${values.length}`, values);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update product.' });
  }
}

// ─── Contact Messages ─────────────────────────────────────

async function listMessages(req, res) {
  try {
    const result = await pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    res.json({ success: true, messages: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load messages.' });
  }
}

// ─── Dashboard Stats ──────────────────────────────────────

async function stats(req, res) {
  try {
    const [orders, revenue, pending, messages] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM orders WHERE status NOT IN ('draft','payment_failed')`),
      pool.query(`SELECT COALESCE(SUM(amount_tnd), 0) AS total FROM orders WHERE status IN ('paid','fulfilled')`),
      pool.query(`SELECT COUNT(*) FROM orders WHERE status = 'paid'`),
      pool.query(`SELECT COUNT(*) FROM contact_messages WHERE status = 'open'`),
    ]);
    res.json({
      success: true,
      stats: {
        total_orders: parseInt(orders.rows[0].count),
        total_revenue_tnd: parseFloat(revenue.rows[0].total),
        pending_fulfillment: parseInt(pending.rows[0].count),
        open_messages: parseInt(messages.rows[0].count),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load stats.' });
  }
}

module.exports = { listOrders, fulfillOrder, updateOrderStatus, listProducts, createProduct, updateProduct, listMessages, stats };
