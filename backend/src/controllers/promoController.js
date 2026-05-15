const pool = require('../config/db');
const {
  rejectUnexpectedFields,
  cleanString,
  cleanInteger,
  cleanUuid,
  handleValidationError,
} = require('../utils/validation');

function normalizeCode(code) {
  return String(code || '').trim().toUpperCase().replace(/\s+/g, '');
}

async function validatePromo(req, res) {
  try {
    rejectUnexpectedFields(req.body, ['code', 'amount_tnd'], 'Promo');
    const code = normalizeCode(cleanString(req.body.code, { label: 'Promo code', required: true, max: 50 }));
    const amount = req.body.amount_tnd === undefined || req.body.amount_tnd === null || req.body.amount_tnd === ''
      ? null
      : Number(req.body.amount_tnd);

    if (amount !== null && (!Number.isFinite(amount) || amount < 0)) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive number.' });
    }

    const result = await pool.query(
      `SELECT code, discount_percent
       FROM promo_codes
       WHERE UPPER(code) = UPPER($1) AND active = TRUE
       LIMIT 1`,
      [code]
    );
    const promo = result.rows[0];
    if (!promo) {
      return res.status(404).json({ success: false, message: 'Invalid promo code.' });
    }

    const discountPercent = Number(promo.discount_percent);
    const discount = amount === null ? null : parseFloat((amount * (discountPercent / 100)).toFixed(3));
    const total = amount === null ? null : parseFloat(Math.max(0, amount - discount).toFixed(3));

    res.json({
      success: true,
      promo: {
        code: promo.code,
        discount_percent: discountPercent,
        discount_tnd: discount,
        total_tnd: total,
      },
    });
  } catch (err) {
    if (handleValidationError(err, res)) return;
    console.error('[promos/validate]', err);
    res.status(500).json({ success: false, message: 'Could not validate promo code.' });
  }
}

async function listPromoCodes(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, code, discount_percent, active, created_at, updated_at
       FROM promo_codes
       ORDER BY created_at DESC`
    );
    res.json({ success: true, promo_codes: result.rows });
  } catch (err) {
    console.error('[admin/promo-codes]', err);
    res.status(500).json({ success: false, message: 'Failed to load promo codes.' });
  }
}

async function createPromoCode(req, res) {
  try {
    rejectUnexpectedFields(req.body, ['code', 'discount_percent', 'active'], 'Promo code');
    const code = normalizeCode(cleanString(req.body.code, { label: 'Promo code', required: true, max: 50 }));
    if (req.body.discount_percent === undefined || req.body.discount_percent === null || req.body.discount_percent === '') {
      return res.status(400).json({ success: false, message: 'Discount percentage is required.' });
    }
    const discount = cleanInteger(req.body.discount_percent, { label: 'Discount percentage', min: 0, max: 100 });
    const active = req.body.active === undefined ? true : req.body.active !== false;

    if (!/^[A-Z0-9_-]{3,50}$/.test(code)) {
      return res.status(400).json({ success: false, message: 'Promo code must use 3-50 letters, numbers, dashes, or underscores.' });
    }

    const result = await pool.query(
      `INSERT INTO promo_codes (code, discount_percent, active)
       VALUES ($1, $2, $3)
       RETURNING id, code, discount_percent, active, created_at, updated_at`,
      [code, discount, active]
    );
    res.status(201).json({ success: true, promo_code: result.rows[0] });
  } catch (err) {
    if (handleValidationError(err, res)) return;
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'This promo code already exists.' });
    }
    console.error('[admin/createPromoCode]', err);
    res.status(500).json({ success: false, message: 'Failed to create promo code.' });
  }
}

async function updatePromoCode(req, res) {
  try {
    const promoId = cleanUuid(req.params.id, { label: 'Promo code' });
    rejectUnexpectedFields(req.body, ['code', 'discount_percent', 'active'], 'Promo code');
    const updates = [];
    const values = [];

    if (req.body.code !== undefined) {
      const code = normalizeCode(cleanString(req.body.code, { label: 'Promo code', required: true, max: 50 }));
      if (!/^[A-Z0-9_-]{3,50}$/.test(code)) {
        return res.status(400).json({ success: false, message: 'Promo code must use 3-50 letters, numbers, dashes, or underscores.' });
      }
      values.push(code);
      updates.push(`code = $${values.length}`);
    }

    if (req.body.discount_percent !== undefined) {
      const discount = cleanInteger(req.body.discount_percent, { label: 'Discount percentage', min: 0, max: 100 });
      if (discount === null) {
        return res.status(400).json({ success: false, message: 'Discount percentage is required.' });
      }
      values.push(discount);
      updates.push(`discount_percent = $${values.length}`);
    }

    if (req.body.active !== undefined) {
      values.push(req.body.active !== false);
      updates.push(`active = $${values.length}`);
    }

    if (!updates.length) {
      return res.status(400).json({ success: false, message: 'No promo code changes provided.' });
    }

    values.push(promoId);
    const result = await pool.query(
      `UPDATE promo_codes
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${values.length}
       RETURNING id, code, discount_percent, active, created_at, updated_at`,
      values
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Promo code not found.' });
    res.json({ success: true, promo_code: result.rows[0] });
  } catch (err) {
    if (handleValidationError(err, res)) return;
    if (err.code === '23505') {
      return res.status(409).json({ success: false, message: 'This promo code already exists.' });
    }
    console.error('[admin/updatePromoCode]', err);
    res.status(500).json({ success: false, message: 'Failed to update promo code.' });
  }
}

async function deletePromoCode(req, res) {
  try {
    const promoId = cleanUuid(req.params.id, { label: 'Promo code' });
    const result = await pool.query('DELETE FROM promo_codes WHERE id = $1 RETURNING id', [promoId]);
    if (!result.rows[0]) return res.status(404).json({ success: false, message: 'Promo code not found.' });
    res.json({ success: true });
  } catch (err) {
    console.error('[admin/deletePromoCode]', err);
    res.status(500).json({ success: false, message: 'Failed to delete promo code.' });
  }
}

module.exports = {
  validatePromo,
  listPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
};
