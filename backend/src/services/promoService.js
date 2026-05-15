const pool = require('../config/db');

function normalizeCode(code) {
  return String(code || '').trim().toUpperCase().replace(/\s+/g, '');
}

function discountForAmount(amount, discountPercent) {
  const discount = parseFloat((amount * (discountPercent / 100)).toFixed(3));
  const total = parseFloat(Math.max(0, amount - discount).toFixed(3));
  return { discount, total };
}

async function loadActivePromo(code) {
  const normalized = normalizeCode(code);
  if (!normalized) return null;

  const result = await pool.query(
    `SELECT id, code, discount_percent, active, usage_count, max_uses
     FROM promo_codes
     WHERE UPPER(code) = UPPER($1) AND active = TRUE
     LIMIT 1`,
    [normalized]
  );
  const promo = result.rows[0];
  if (!promo) return null;

  const usageCount = Number(promo.usage_count || 0);
  const maxUses = promo.max_uses === null || promo.max_uses === undefined ? null : Number(promo.max_uses);
  if (maxUses !== null && usageCount >= maxUses) {
    await pool.query(
      `UPDATE promo_codes
       SET active = FALSE, updated_at = NOW()
       WHERE id = $1`,
      [promo.id]
    );
    return null;
  }

  return promo;
}

async function validatePromoForAmount(code, amount) {
  const promo = await loadActivePromo(code);
  if (!promo) return null;

  const discountPercent = Number(promo.discount_percent);
  const totals = amount === null ? { discount: null, total: null } : discountForAmount(amount, discountPercent);

  return {
    ...promo,
    discount_percent: discountPercent,
    discount_tnd: totals.discount,
    total_tnd: totals.total,
  };
}

async function consumePromoCode(code) {
  const normalized = normalizeCode(code);
  if (!normalized) return null;

  const result = await pool.query(
    `UPDATE promo_codes
     SET usage_count = COALESCE(usage_count, 0) + 1,
         active = CASE
           WHEN max_uses IS NOT NULL AND COALESCE(usage_count, 0) + 1 >= max_uses THEN FALSE
           ELSE active
         END,
         updated_at = NOW()
     WHERE UPPER(code) = UPPER($1)
     RETURNING id, code, discount_percent, active, usage_count, max_uses`,
    [normalized]
  );

  return result.rows[0] || null;
}

module.exports = {
  normalizeCode,
  validatePromoForAmount,
  consumePromoCode,
};
