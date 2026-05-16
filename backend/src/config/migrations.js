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

    CREATE TABLE IF NOT EXISTS wishlist_items (
      user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
      product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY(user_id, product_id)
    );

    CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON wishlist_items(user_id);
    CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id ON wishlist_items(product_id);

    CREATE TABLE IF NOT EXISTS sale_notifications (
      user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
      product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
      active      BOOLEAN DEFAULT TRUE,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW(),
      PRIMARY KEY(user_id, product_id)
    );

    CREATE INDEX IF NOT EXISTS idx_sale_notifications_user_id ON sale_notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_sale_notifications_product_id ON sale_notifications(product_id);

    CREATE TABLE IF NOT EXISTS product_reviews (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
      order_id    UUID REFERENCES orders(id) ON DELETE CASCADE,
      product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
      rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment     TEXT,
      created_at  TIMESTAMPTZ DEFAULT NOW(),
      updated_at  TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(order_id)
    );

    CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
    CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id ON product_reviews(user_id);

    CREATE TABLE IF NOT EXISTS product_events (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      product_id        UUID REFERENCES products(id) ON DELETE CASCADE,
      user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
      event_type        VARCHAR(30) NOT NULL,
      visitor_key_hash  VARCHAR(96),
      source            VARCHAR(50),
      user_agent        TEXT,
      created_at        TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_product_events_product_type_created
      ON product_events(product_id, event_type, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_product_events_user_created
      ON product_events(user_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_product_events_visitor_recent
      ON product_events(product_id, event_type, visitor_key_hash, created_at DESC);

    CREATE TABLE IF NOT EXISTS promo_codes (
      id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code              VARCHAR(50) UNIQUE NOT NULL,
      discount_percent  INTEGER NOT NULL CHECK (discount_percent BETWEEN 0 AND 100),
      usage_count       INTEGER DEFAULT 0,
      max_uses          INTEGER CHECK (max_uses IS NULL OR max_uses > 0),
      active            BOOLEAN DEFAULT TRUE,
      created_at        TIMESTAMPTZ DEFAULT NOW(),
      updated_at        TIMESTAMPTZ DEFAULT NOW()
    );

    ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
    ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS max_uses INTEGER CHECK (max_uses IS NULL OR max_uses > 0);
    UPDATE promo_codes SET usage_count = 0 WHERE usage_count IS NULL;

    CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(UPPER(code));
    INSERT INTO promo_codes (code, discount_percent, active)
    VALUES ('LBARA10', 10, TRUE)
    ON CONFLICT (code) DO NOTHING;

    CREATE TABLE IF NOT EXISTS ticket_quotes (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      quote_ref       VARCHAR(20) UNIQUE NOT NULL,
      ticket_order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
      final_order_id  UUID REFERENCES orders(id) ON DELETE SET NULL,
      token           VARCHAR(96) UNIQUE NOT NULL,
      service_title   VARCHAR(255) NOT NULL,
      description     TEXT,
      amount_tnd      NUMERIC(10, 3) NOT NULL,
      status          VARCHAR(30) DEFAULT 'sent',
      created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
      sent_at         TIMESTAMPTZ,
      paid_at         TIMESTAMPTZ,
      created_at      TIMESTAMPTZ DEFAULT NOW(),
      updated_at      TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_ticket_quotes_token ON ticket_quotes(token);
    CREATE INDEX IF NOT EXISTS idx_ticket_quotes_ticket_order_id ON ticket_quotes(ticket_order_id);
    CREATE INDEX IF NOT EXISTS idx_ticket_quotes_final_order_id ON ticket_quotes(final_order_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_ticket_quotes_open_ticket_order_id
      ON ticket_quotes(ticket_order_id)
      WHERE status IN ('sent', 'paid');

    ALTER TABLE orders ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS ticket_quote_id UUID REFERENCES ticket_quotes(id) ON DELETE SET NULL;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_type VARCHAR(50);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_method VARCHAR(80);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_details TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(128);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(128);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMPTZ;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en';
    ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
    ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS reference VARCHAR(20);
    ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS ticket_reference VARCHAR(30);

    UPDATE contact_messages
    SET reference = UPPER(SUBSTRING(REPLACE(id::text, '-', '') FROM 1 FOR 8))
    WHERE reference IS NULL;

    UPDATE contact_messages cm
    SET user_id = u.id
    FROM users u
    WHERE cm.user_id IS NULL
      AND LOWER(cm.email) = LOWER(u.email);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_messages_reference ON contact_messages(reference);
    CREATE INDEX IF NOT EXISTS idx_contact_messages_user_id ON contact_messages(user_id);
    CREATE INDEX IF NOT EXISTS idx_contact_messages_ticket_reference ON contact_messages(UPPER(ticket_reference));

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

  await pool.query(`
    UPDATE products
    SET active = FALSE
    WHERE slug IN (
      'netflix-premium-1m',
      'chatgpt-plus-1m',
      'spotify-family-1m',
      'canva-pro-1m',
      'youtube-premium-1m',
      'adobe-cc-1m'
    )
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
