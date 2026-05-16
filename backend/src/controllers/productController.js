const pool = require('../config/db');
const crypto = require('crypto');
const {
  cleanString,
  cleanUuid,
  cleanEnum,
  cleanInteger,
  requirePlainObject,
  rejectUnexpectedFields,
  handleValidationError,
} = require('../utils/validation');

const PRODUCT_SELECT = `
  SELECT
    p.*,
    COALESCE(rs.review_count, 0)::int AS review_count,
    COALESCE(rs.average_rating, 0)::numeric(3, 2) AS average_rating,
    COALESCE(rs.weekly_review_count, 0)::int AS weekly_review_count,
    COALESCE(rs.monthly_review_count, 0)::int AS monthly_review_count,
    COALESCE(os.weekly_order_count, 0)::int AS weekly_order_count,
    COALESCE(os.monthly_order_count, 0)::int AS monthly_order_count,
    COALESCE(wl.favorite_count, 0)::int AS favorite_count,
    COALESCE(wl.weekly_favorite_count, 0)::int AS weekly_favorite_count,
    COALESCE(wl.monthly_favorite_count, 0)::int AS monthly_favorite_count,
    COALESCE(vs.weekly_view_count, 0)::int AS weekly_view_count,
    COALESCE(vs.monthly_view_count, 0)::int AS monthly_view_count,
    ROUND((
      COALESCE(os.weekly_order_count, 0) * 8
      + COALESCE(vs.weekly_view_count, 0) * 1
      + COALESCE(wl.weekly_favorite_count, 0) * 4
      + COALESCE(rs.weekly_review_count, 0) * 5
      + CASE WHEN COALESCE(rs.weekly_review_count, 0) > 0 THEN COALESCE(rs.average_rating, 0) ELSE 0 END
    )::numeric, 2) AS hot_score,
    ROUND((
      COALESCE(os.monthly_order_count, 0) * 8
      + COALESCE(vs.monthly_view_count, 0) * 1
      + COALESCE(wl.monthly_favorite_count, 0) * 4
      + COALESCE(rs.monthly_review_count, 0) * 5
      + COALESCE(rs.average_rating, 0) * LEAST(COALESCE(rs.review_count, 0), 10) * 0.4
    )::numeric, 2) AS favorite_score,
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
  FROM products p
  LEFT JOIN product_variants v ON v.product_id = p.id AND v.active = TRUE
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*)::int AS review_count,
      ROUND(AVG(rating)::numeric, 2) AS average_rating,
      (COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days'))::int AS weekly_review_count,
      (COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'))::int AS monthly_review_count
    FROM product_reviews
    WHERE product_id = p.id
  ) rs ON TRUE
  LEFT JOIN LATERAL (
    SELECT
      (COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days'))::int AS weekly_order_count,
      (COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'))::int AS monthly_order_count
    FROM orders
    WHERE product_id = p.id
      AND status IN ('paid', 'processing', 'fulfilled')
  ) os ON TRUE
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*)::int AS favorite_count,
      (COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days'))::int AS weekly_favorite_count,
      (COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'))::int AS monthly_favorite_count
    FROM wishlist_items
    WHERE product_id = p.id
  ) wl ON TRUE
  LEFT JOIN LATERAL (
    SELECT
      (COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days'))::int AS weekly_view_count,
      (COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'))::int AS monthly_view_count
    FROM product_events
    WHERE product_id = p.id
      AND event_type = 'view'
  ) vs ON TRUE
`;

const PRODUCT_ORDER = `
  CASE
    WHEN p.slug = 'netflix-subscription' THEN 10
    WHEN p.slug = 'youtube-premium' THEN 20
    WHEN p.slug = 'chatgpt-plus' THEN 30
    WHEN p.slug = 'claude-pro' THEN 40
    WHEN p.slug = 'spotify-subscription' THEN 50
    WHEN p.slug = 'prime-video' THEN 60
    WHEN p.slug = 'disney-plus' THEN 70
    WHEN p.slug = 'canva-pro' THEN 80
    WHEN p.slug = 'adobe-creative-cloud' THEN 90
    WHEN p.slug = 'microsoft-365' THEN 100
    WHEN p.category = 'gift_cards' THEN 800
    ELSE 500
  END,
  p.name ASC
`;

const SPECIAL_CATEGORIES = ['hot_this_week', 'users_favorite'];

function productWhereClause({ category, search }, params) {
  const conditions = ['p.active = TRUE'];

  if (category === 'hot_this_week') {
    conditions.push(`(
      EXISTS (
        SELECT 1 FROM orders hot_orders
        WHERE hot_orders.product_id = p.id
          AND hot_orders.status IN ('paid', 'processing', 'fulfilled')
          AND hot_orders.created_at >= NOW() - INTERVAL '7 days'
      )
      OR EXISTS (
        SELECT 1 FROM product_events hot_views
        WHERE hot_views.product_id = p.id
          AND hot_views.event_type = 'view'
          AND hot_views.created_at >= NOW() - INTERVAL '7 days'
      )
      OR EXISTS (
        SELECT 1 FROM wishlist_items hot_wishlist
        WHERE hot_wishlist.product_id = p.id
          AND hot_wishlist.created_at >= NOW() - INTERVAL '7 days'
      )
      OR EXISTS (
        SELECT 1 FROM product_reviews hot_reviews
        WHERE hot_reviews.product_id = p.id
          AND hot_reviews.created_at >= NOW() - INTERVAL '7 days'
      )
    )`);
  } else if (category === 'users_favorite') {
    conditions.push(`(
      EXISTS (
        SELECT 1 FROM orders favorite_orders
        WHERE favorite_orders.product_id = p.id
          AND favorite_orders.status IN ('paid', 'processing', 'fulfilled')
          AND favorite_orders.created_at >= NOW() - INTERVAL '30 days'
      )
      OR EXISTS (
        SELECT 1 FROM product_events favorite_views
        WHERE favorite_views.product_id = p.id
          AND favorite_views.event_type = 'view'
          AND favorite_views.created_at >= NOW() - INTERVAL '30 days'
      )
      OR EXISTS (
        SELECT 1 FROM wishlist_items favorite_wishlist
        WHERE favorite_wishlist.product_id = p.id
          AND favorite_wishlist.created_at >= NOW() - INTERVAL '30 days'
      )
      OR EXISTS (
        SELECT 1 FROM product_reviews favorite_reviews
        WHERE favorite_reviews.product_id = p.id
          AND favorite_reviews.created_at >= NOW() - INTERVAL '30 days'
      )
    )`);
  } else if (category && category !== 'all') {
    params.push(category);
    conditions.push(`p.category = $${params.length}`);
  }

  const searchTerms = String(search || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 6);

  searchTerms.forEach((term) => {
    params.push(`%${term}%`);
    conditions.push(`(
      p.name ILIKE $${params.length}
      OR p.provider ILIKE $${params.length}
      OR p.description ILIKE $${params.length}
      OR EXISTS (
        SELECT 1 FROM product_variants sv
        WHERE sv.product_id = p.id
          AND sv.active = TRUE
          AND (sv.name ILIKE $${params.length} OR sv.description ILIKE $${params.length})
      )
    )`);
  });

  return conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
}

function productOrderClause(category) {
  if (category === 'hot_this_week') {
    return `
      hot_score DESC,
      COALESCE(os.weekly_order_count, 0) DESC,
      COALESCE(vs.weekly_view_count, 0) DESC,
      COALESCE(rs.average_rating, 0) DESC,
      COALESCE(rs.review_count, 0) DESC,
      COALESCE(wl.favorite_count, 0) DESC,
      ${PRODUCT_ORDER}
    `;
  }

  if (category === 'users_favorite') {
    return `
      favorite_score DESC,
      COALESCE(os.monthly_order_count, 0) DESC,
      COALESCE(vs.monthly_view_count, 0) DESC,
      COALESCE(rs.average_rating, 0) DESC,
      COALESCE(rs.review_count, 0) DESC,
      COALESCE(wl.favorite_count, 0) DESC,
      ${PRODUCT_ORDER}
    `;
  }

  return PRODUCT_ORDER;
}

const PRODUCT_METRIC_GROUPS = `
  p.id,
  rs.review_count,
  rs.average_rating,
  rs.weekly_review_count,
  rs.monthly_review_count,
  os.weekly_order_count,
  os.monthly_order_count,
  wl.favorite_count,
  wl.weekly_favorite_count,
  wl.monthly_favorite_count,
  vs.weekly_view_count,
  vs.monthly_view_count
`;

function hashVisitorKey(req, visitorKey) {
  const rawKey = visitorKey || `${req.ip || 'unknown'}:${req.get('user-agent') || 'unknown'}`;
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

async function list(req, res) {
  try {
    rejectUnexpectedFields(req.query, ['category', 'search', 'page', 'limit'], 'Catalog query');
    const category = cleanString(req.query.category, { label: 'Category', required: false, max: 100 });
    const search = cleanString(req.query.search, { label: 'Search', required: false, max: 120 });
    const pageNum = cleanInteger(req.query.page, { label: 'Page', defaultValue: 1, min: 1, max: 500 });
    const limitNum = cleanInteger(req.query.limit, { label: 'Limit', defaultValue: 18, min: 1, max: 50 });
    const offset = (pageNum - 1) * limitNum;
    const params = [];
    const where = productWhereClause({ category, search }, params);

    params.push(limitNum);
    params.push(offset);

    const [rows, countResult] = await Promise.all([
      pool.query(`${PRODUCT_SELECT} ${where} GROUP BY ${PRODUCT_METRIC_GROUPS} ORDER BY ${productOrderClause(category)} LIMIT $${params.length - 1} OFFSET $${params.length}`, params),
      pool.query(`SELECT COUNT(*) FROM products p ${where}`, params.slice(0, -2)),
    ]);

    res.json({
      success: true,
      products: rows.rows,
      total: parseInt(countResult.rows[0].count),
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    if (handleValidationError(err, res)) return;
    console.error('[products/list]', err);
    res.status(500).json({ success: false, message: 'Failed to load products.' });
  }
}

async function getOne(req, res) {
  try {
    const id = cleanUuid(req.params.id, { label: 'Product' });
    const result = await pool.query(
      `${PRODUCT_SELECT} WHERE p.id = $1 AND p.active = TRUE GROUP BY ${PRODUCT_METRIC_GROUPS}`,
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, product: result.rows[0] });
  } catch (err) {
    if (handleValidationError(err, res)) return;
    console.error('[products/getOne]', err);
    res.status(500).json({ success: false, message: 'Failed to load product.' });
  }
}

async function trackView(req, res) {
  try {
    requirePlainObject(req.body || {}, 'Product view');
    rejectUnexpectedFields(req.body || {}, ['visitor_key', 'source'], 'Product view');

    const id = cleanUuid(req.params.id, { label: 'Product' });
    const visitorKey = cleanString(req.body?.visitor_key, { label: 'Visitor key', required: false, max: 128 });
    const source = cleanEnum(req.body?.source, ['product_page', 'shop_card'], { label: 'Source', required: false }) || 'product_page';
    const visitorHash = hashVisitorKey(req, visitorKey);

    const productResult = await pool.query('SELECT id FROM products WHERE id = $1 AND active = TRUE', [id]);
    if (!productResult.rows[0]) return res.status(404).json({ success: false, message: 'Product not found.' });

    const duplicateParams = [id, visitorHash];
    let userClause = '';
    if (req.user?.id) {
      duplicateParams.push(req.user.id);
      userClause = `OR user_id = $3`;
    }

    const duplicate = await pool.query(
      `SELECT id
       FROM product_events
       WHERE product_id = $1
         AND event_type = 'view'
         AND created_at >= NOW() - INTERVAL '6 hours'
         AND (visitor_key_hash = $2 ${userClause})
       LIMIT 1`,
      duplicateParams
    );

    if (!duplicate.rows.length) {
      await pool.query(
        `INSERT INTO product_events (product_id, user_id, event_type, visitor_key_hash, source, user_agent)
         VALUES ($1, $2, 'view', $3, $4, $5)`,
        [id, req.user?.id || null, visitorHash, source, cleanString(req.get('user-agent') || '', { label: 'User agent', required: false, max: 500 })]
      );
    }

    res.status(201).json({ success: true, tracked: !duplicate.rows.length });
  } catch (err) {
    if (handleValidationError(err, res)) return;
    console.error('[products/trackView]', err);
    res.status(500).json({ success: false, message: 'Failed to record product activity.' });
  }
}

async function reviews(req, res) {
  try {
    const id = cleanUuid(req.params.id, { label: 'Product' });
    const result = await pool.query(
      `SELECT rating, comment, created_at
       FROM product_reviews
       WHERE product_id = $1
       ORDER BY created_at DESC
       LIMIT 12`,
      [id]
    );
    res.json({ success: true, reviews: result.rows });
  } catch (err) {
    if (handleValidationError(err, res)) return;
    console.error('[products/reviews]', err);
    res.status(500).json({ success: false, message: 'Failed to load reviews.' });
  }
}

module.exports = { list, getOne, reviews, trackView };
