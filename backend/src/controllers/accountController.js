const pool = require('../config/db');
const {
  cleanUuid,
  rejectUnexpectedFields,
  handleValidationError,
} = require('../utils/validation');

const ACCOUNT_PRODUCT_SELECT = `
  p.id,
  p.slug,
  p.name,
  p.provider,
  p.category,
  p.description,
  p.price_tnd,
  p.badge,
  p.account_type,
  p.duration_label,
  p.delivery_hours,
  p.fulfillment_type,
  p.image_url,
  COUNT(v.id)::int AS variant_count,
  MIN(v.price_tnd) FILTER (WHERE v.price_tnd IS NOT NULL)::numeric AS min_variant_price_tnd,
  COALESCE(
    json_agg(
      json_build_object(
        'id', v.id,
        'slug', v.slug,
        'name', v.name,
        'description', v.description,
        'billing_period', v.billing_period,
        'price_tnd', v.price_tnd,
        'checkout_mode', v.checkout_mode,
        'deposit_tnd', v.deposit_tnd,
        'sort_order', v.sort_order
      )
      ORDER BY v.sort_order, v.name
    ) FILTER (WHERE v.id IS NOT NULL),
    '[]'::json
  ) AS variants
`;

async function requireActiveProduct(productId) {
  const result = await pool.query('SELECT id FROM products WHERE id = $1 AND active = TRUE', [productId]);
  return Boolean(result.rows[0]);
}

async function listWishlist(req, res) {
  try {
    const result = await pool.query(
      `SELECT
         wi.created_at AS saved_at,
         ${ACCOUNT_PRODUCT_SELECT}
       FROM wishlist_items wi
       JOIN products p ON p.id = wi.product_id
       LEFT JOIN product_variants v ON v.product_id = p.id AND v.active = TRUE
       WHERE wi.user_id = $1 AND p.active = TRUE
       GROUP BY wi.created_at, p.id
       ORDER BY wi.created_at DESC`,
      [req.user.id]
    );

    res.json({ success: true, products: result.rows });
  } catch (err) {
    console.error('[account/listWishlist]', err);
    res.status(500).json({ success: false, message: 'Failed to load favorites.' });
  }
}

async function addWishlist(req, res) {
  try {
    rejectUnexpectedFields(req.body, ['product_id'], 'Favorite request');
    const productId = cleanUuid(req.body.product_id, { label: 'Product' });
    if (!(await requireActiveProduct(productId))) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    await pool.query(
      `INSERT INTO wishlist_items (user_id, product_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, product_id) DO NOTHING`,
      [req.user.id, productId]
    );

    res.status(201).json({ success: true, product_id: productId });
  } catch (err) {
    if (handleValidationError(err, res)) return;
    console.error('[account/addWishlist]', err);
    res.status(500).json({ success: false, message: 'Failed to save favorite.' });
  }
}

async function removeWishlist(req, res) {
  try {
    const productId = cleanUuid(req.params.productId, { label: 'Product' });
    await pool.query(
      'DELETE FROM wishlist_items WHERE user_id = $1 AND product_id = $2',
      [req.user.id, productId]
    );
    res.json({ success: true, product_id: productId });
  } catch (err) {
    if (handleValidationError(err, res)) return;
    console.error('[account/removeWishlist]', err);
    res.status(500).json({ success: false, message: 'Failed to remove favorite.' });
  }
}

async function listSaleNotifications(req, res) {
  try {
    const result = await pool.query(
      `SELECT
         sn.created_at AS notified_at,
         ${ACCOUNT_PRODUCT_SELECT}
       FROM sale_notifications sn
       JOIN products p ON p.id = sn.product_id
       LEFT JOIN product_variants v ON v.product_id = p.id AND v.active = TRUE
       WHERE sn.user_id = $1 AND sn.active = TRUE AND p.active = TRUE
       GROUP BY sn.created_at, p.id
       ORDER BY sn.created_at DESC`,
      [req.user.id]
    );

    res.json({ success: true, products: result.rows });
  } catch (err) {
    console.error('[account/listSaleNotifications]', err);
    res.status(500).json({ success: false, message: 'Failed to load sale alerts.' });
  }
}

async function addSaleNotification(req, res) {
  try {
    rejectUnexpectedFields(req.body, ['product_id'], 'Sale alert request');
    const productId = cleanUuid(req.body.product_id, { label: 'Product' });
    if (!(await requireActiveProduct(productId))) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    await pool.query(
      `INSERT INTO sale_notifications (user_id, product_id, active, updated_at)
       VALUES ($1, $2, TRUE, NOW())
       ON CONFLICT (user_id, product_id)
       DO UPDATE SET active = TRUE, updated_at = NOW()`,
      [req.user.id, productId]
    );

    res.status(201).json({ success: true, product_id: productId });
  } catch (err) {
    if (handleValidationError(err, res)) return;
    console.error('[account/addSaleNotification]', err);
    res.status(500).json({ success: false, message: 'Failed to turn on sale alert.' });
  }
}

async function removeSaleNotification(req, res) {
  try {
    const productId = cleanUuid(req.params.productId, { label: 'Product' });
    await pool.query(
      `UPDATE sale_notifications
       SET active = FALSE, updated_at = NOW()
       WHERE user_id = $1 AND product_id = $2`,
      [req.user.id, productId]
    );
    res.json({ success: true, product_id: productId });
  } catch (err) {
    if (handleValidationError(err, res)) return;
    console.error('[account/removeSaleNotification]', err);
    res.status(500).json({ success: false, message: 'Failed to turn off sale alert.' });
  }
}

async function listContactRequests(req, res) {
  try {
    const result = await pool.query(
      `SELECT
         id,
         COALESCE(reference, UPPER(SUBSTRING(REPLACE(id::text, '-', '') FROM 1 FOR 8))) AS reference,
         subject,
         category,
         ticket_reference,
         status,
         LEFT(message, 180) AS message_preview,
         created_at
       FROM contact_messages
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 25`,
      [req.user.id]
    );

    res.json({ success: true, requests: result.rows });
  } catch (err) {
    console.error('[account/listContactRequests]', err);
    res.status(500).json({ success: false, message: 'Failed to load support requests.' });
  }
}

module.exports = {
  listWishlist,
  addWishlist,
  removeWishlist,
  listSaleNotifications,
  addSaleNotification,
  removeSaleNotification,
  listContactRequests,
};
