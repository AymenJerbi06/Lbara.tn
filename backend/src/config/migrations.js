const pool = require('./db');
const { seedProductCatalog } = require('./catalogSeed');
const { syncProductPricesFromWorkbook } = require('../services/priceSheetService');

async function ensureRuntimeMigrations() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    ALTER TABLE products ADD COLUMN IF NOT EXISTS fulfillment_type VARCHAR(50) DEFAULT 'account_setup';

    CREATE TABLE IF NOT EXISTS product_variants (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id      UUID REFERENCES products(id) ON DELETE CASCADE,
      slug            VARCHAR(255) NOT NULL,
      name            VARCHAR(255) NOT NULL,
      description     TEXT,
      billing_period  VARCHAR(80),
      price_tnd       NUMERIC(10, 3),
      checkout_mode   VARCHAR(30) DEFAULT 'full_payment',
      deposit_tnd     NUMERIC(10, 3),
      sort_order      INTEGER DEFAULT 100,
      active          BOOLEAN DEFAULT TRUE,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(product_id, slug)
    );

    CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);

    ALTER TABLE orders ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_type VARCHAR(50);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_method VARCHAR(80);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_details TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(128);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(128);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMPTZ;

    CREATE TABLE IF NOT EXISTS schema_migrations (
      key VARCHAR(120) PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );

    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE key = 'fulfillment_seed_v1') THEN
        UPDATE products
        SET fulfillment_type = 'gift_card'
        WHERE slug IN ('netflix-premium-1m', 'youtube-premium-1m')
          AND fulfillment_type = 'account_setup';

        UPDATE products
        SET fulfillment_type = 'giftable_subscription'
        WHERE slug = 'chatgpt-plus-1m'
          AND fulfillment_type = 'account_setup';

        INSERT INTO schema_migrations (key) VALUES ('fulfillment_seed_v1');
      END IF;
    END $$;
  `);

  await seedProductCatalog(pool);

  try {
    const priceSheetResult = await syncProductPricesFromWorkbook(pool);
    if (!priceSheetResult.skipped) {
      console.log(`[INFO] Price sheet synced: ${priceSheetResult.variantsUpdated} variants updated.`);
      if (priceSheetResult.warnings?.length) {
        console.warn('[WARN] Price sheet warnings:', priceSheetResult.warnings.slice(0, 5).join('; '));
      }
    }
  } catch (err) {
    console.error('[WARN] Price sheet sync skipped:', err.message);
  }
}

module.exports = { ensureRuntimeMigrations };
