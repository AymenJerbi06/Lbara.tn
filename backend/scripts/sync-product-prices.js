require('dotenv').config();
const pool = require('../src/config/db');
const { syncProductPricesFromWorkbook } = require('../src/services/priceSheetService');

async function main() {
  const workbookPath = process.argv[2] || process.env.PRICE_SHEET_PATH;
  const pricingTablePath = process.argv[3] || process.env.PRICING_TABLE_PATH;
  const result = await syncProductPricesFromWorkbook(pool, { workbookPath, pricingTablePath });
  console.log(JSON.stringify(result, null, 2));
  await pool.end();
}

main().catch(async (err) => {
  console.error('[prices/sync]', err.message);
  try { await pool.end(); } catch {}
  process.exit(1);
});
