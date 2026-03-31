const pool = require('../config/db');

async function list(req, res) {
  const { category, search, page = 1, limit = 9 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  const params = [];
  const conditions = ['active = TRUE'];

  if (category && category !== 'all') {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(name ILIKE $${params.length} OR provider ILIKE $${params.length} OR description ILIKE $${params.length})`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(parseInt(limit));
  params.push(offset);

  try {
    const [rows, countResult] = await Promise.all([
      pool.query(`SELECT * FROM products ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params),
      pool.query(`SELECT COUNT(*) FROM products ${where}`, params.slice(0, -2)),
    ]);
    res.json({
      success: true,
      products: rows.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('[products/list]', err);
    res.status(500).json({ success: false, message: 'Failed to load products.' });
  }
}

async function getOne(req, res) {
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1 AND active = TRUE', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to load product.' });
  }
}

module.exports = { list, getOne };
