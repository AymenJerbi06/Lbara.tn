const WEBSITE_FX_RATE = Number(process.env.WEBSITE_FX_RATE || 2.4);
const DEFAULT_SERVICE_MARGIN = Number(process.env.DEFAULT_SERVICE_MARGIN || 1.3);
const REDUCED_SERVICE_MARGIN = Number(process.env.REDUCED_SERVICE_MARGIN || 1.17);
const GIFT_CARD_MARGIN = Number(process.env.GIFT_CARD_MARGIN || 1.15);
const VPN_BUNDLE_DISCOUNT = Number(process.env.VPN_BUNDLE_DISCOUNT || 0.13);

const REDUCED_MARGIN_CATEGORIES = new Set(['ai_tools', 'education', 'books']);
const ZERO_COST_CHECKOUT_MODES = new Set(['quote']);

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function round(value, digits = 3) {
  return Number(number(value).toFixed(digits));
}

function marginForOrder(order = {}) {
  const category = String(order.category || '').toLowerCase();
  const productSlug = String(order.product_slug || '').toLowerCase();
  const variantSlug = String(order.variant_slug || '').toLowerCase();
  const checkoutMode = String(order.variant_checkout_mode || '').toLowerCase();
  const isInitialTicket = ZERO_COST_CHECKOUT_MODES.has(checkoutMode) && !order.ticket_quote_id;

  if (isInitialTicket) return null;
  if (category === 'gift_cards') return GIFT_CARD_MARGIN;
  if (REDUCED_MARGIN_CATEGORIES.has(category)) return REDUCED_SERVICE_MARGIN;
  if (variantSlug.includes('vpn-bundle') || productSlug.includes('vpn-bundle')) {
    return DEFAULT_SERVICE_MARGIN * (1 - VPN_BUNDLE_DISCOUNT);
  }
  return DEFAULT_SERVICE_MARGIN;
}

function estimateOrderFinancials(order = {}) {
  const paidTnd = number(order.amount_tnd);
  const discountTnd = number(order.discount_tnd);
  const preDiscountTnd = Math.max(0, paidTnd + discountTnd);
  const grossCad = WEBSITE_FX_RATE > 0 ? paidTnd / WEBSITE_FX_RATE : 0;
  const margin = marginForOrder(order);
  const costCad = margin ? (preDiscountTnd / WEBSITE_FX_RATE) / margin : 0;
  const revenueCad = grossCad - costCad;

  return {
    gross_sales_tnd: round(paidTnd),
    gross_sales_cad: round(grossCad),
    money_spent_cad: round(costCad),
    revenue_cad: round(revenueCad),
    revenue_tnd: round(revenueCad * WEBSITE_FX_RATE),
    margin_multiplier: margin,
  };
}

function summarizeOrderFinancials(orders = []) {
  const summary = orders.reduce((totals, order) => {
    const financials = estimateOrderFinancials(order);
    totals.gross_sales_tnd += financials.gross_sales_tnd;
    totals.gross_sales_cad += financials.gross_sales_cad;
    totals.money_spent_cad += financials.money_spent_cad;
    totals.revenue_cad += financials.revenue_cad;
    totals.revenue_tnd += financials.revenue_tnd;
    return totals;
  }, {
    gross_sales_tnd: 0,
    gross_sales_cad: 0,
    money_spent_cad: 0,
    revenue_cad: 0,
    revenue_tnd: 0,
  });

  return {
    gross_sales_tnd: round(summary.gross_sales_tnd),
    gross_sales_cad: round(summary.gross_sales_cad),
    money_spent_cad: round(summary.money_spent_cad),
    revenue_cad: round(summary.revenue_cad),
    revenue_tnd: round(summary.revenue_tnd),
  };
}

module.exports = {
  WEBSITE_FX_RATE,
  estimateOrderFinancials,
  summarizeOrderFinancials,
};
