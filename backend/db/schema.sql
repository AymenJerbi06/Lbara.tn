-- lbara.tn PostgreSQL Schema
-- Run: psql -U postgres -d lbara_db -f db/schema.sql

-- ─── Extensions ──────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255),
  phone         VARCHAR(30),
  city          VARCHAR(100),
  preferred_language VARCHAR(10) DEFAULT 'en',
  is_admin      BOOLEAN DEFAULT FALSE,
  is_verified   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Products ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             VARCHAR(255) UNIQUE NOT NULL,
  name             VARCHAR(255) NOT NULL,
  provider         VARCHAR(255) NOT NULL,
  category         VARCHAR(100) NOT NULL,  -- streaming | ai_tools | gaming | productivity | education
  description      TEXT,
  price_tnd        NUMERIC(10, 3) NOT NULL,
  badge            VARCHAR(50),             -- POPULAR | INSTANT | SALE | NEW
  account_type     VARCHAR(50) DEFAULT 'private',  -- private | shared
  duration_label   VARCHAR(100),            -- e.g. "1 Month"
  delivery_hours   INTEGER DEFAULT 2,
  fulfillment_type VARCHAR(50) DEFAULT 'account_setup',
  active           BOOLEAN DEFAULT TRUE,
  image_url        TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Orders ───────────────────────────────────────────────
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

CREATE TABLE IF NOT EXISTS orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_ref           VARCHAR(20) UNIQUE NOT NULL,   -- e.g. LB-82941
  user_id             UUID REFERENCES users(id),
  product_id          UUID REFERENCES products(id),
  variant_id          UUID REFERENCES product_variants(id),
  status              VARCHAR(30) DEFAULT 'pending_payment',
  -- statuses: draft | pending_payment | payment_failed | paid | processing | fulfilled | cancelled | refunded | flagged
  amount_tnd          NUMERIC(10, 3) NOT NULL,
  gateway             VARCHAR(30),                   -- flouci | paymee
  gateway_payment_id  VARCHAR(255),
  delivery_email      VARCHAR(255) NOT NULL,
  delivery_phone      VARCHAR(30),
  fulfillment_type    VARCHAR(50),
  fulfillment_method  VARCHAR(80),
  fulfillment_details TEXT,
  promo_code          VARCHAR(50),
  discount_tnd        NUMERIC(10, 3) DEFAULT 0,
  ip_address          VARCHAR(45),
  user_agent          TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Payments ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID REFERENCES orders(id),
  gateway             VARCHAR(30) NOT NULL,
  gateway_payment_id  VARCHAR(255),
  gateway_status      VARCHAR(50),
  raw_response        JSONB,
  verified_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

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

ALTER TABLE orders ADD COLUMN IF NOT EXISTS ticket_quote_id UUID REFERENCES ticket_quotes(id) ON DELETE SET NULL;

-- ─── Fulfillments ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fulfillments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID REFERENCES orders(id),
  status           VARCHAR(30) DEFAULT 'pending',  -- pending | sent | confirmed | failed
  credentials      TEXT,   -- encrypted credentials/code to deliver
  notes            TEXT,
  fulfilled_by     UUID REFERENCES users(id),  -- admin user
  delivered_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Contact Messages ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  reference   VARCHAR(20) UNIQUE,
  full_name   VARCHAR(255) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  subject     VARCHAR(255),
  category    VARCHAR(100),
  ticket_reference VARCHAR(30),
  message     TEXT NOT NULL,
  status      VARCHAR(30) DEFAULT 'open',  -- open | in_progress | resolved
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Audit Logs ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type  VARCHAR(50),   -- order | payment | user | product
  entity_id    UUID,
  action       VARCHAR(100),  -- created | status_changed | fulfilled | refunded
  actor_id     UUID,          -- user or admin who triggered it
  actor_type   VARCHAR(20),   -- user | admin | system
  metadata     JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_ref ON orders(order_ref);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_fulfillments_order_id ON fulfillments(order_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(UPPER(code));
CREATE INDEX IF NOT EXISTS idx_ticket_quotes_token ON ticket_quotes(token);
CREATE INDEX IF NOT EXISTS idx_ticket_quotes_ticket_order_id ON ticket_quotes(ticket_order_id);
CREATE INDEX IF NOT EXISTS idx_ticket_quotes_final_order_id ON ticket_quotes(final_order_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ticket_quotes_open_ticket_order_id
  ON ticket_quotes(ticket_order_id)
  WHERE status IN ('sent', 'paid');
CREATE INDEX IF NOT EXISTS idx_contact_messages_ticket_reference ON contact_messages(UPPER(ticket_reference));

-- User engagement
CREATE TABLE IF NOT EXISTS wishlist_items (
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS sale_notifications (
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_product_id ON wishlist_items(product_id);
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

-- ─── Password Reset Columns (safe to run on existing DB) ──
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(128);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(128);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en';

-- ─── Product Image URL (safe to run on existing DB) ──────
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS fulfillment_type VARCHAR(50) DEFAULT 'account_setup';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_type VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_method VARCHAR(80);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_details TEXT;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS reference VARCHAR(20);
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

INSERT INTO promo_codes (code, discount_percent, active)
VALUES ('LBARA10', 10, TRUE)
ON CONFLICT (code) DO NOTHING;

-- ─── Seed Products ────────────────────────────────────────
INSERT INTO products (slug, name, provider, category, description, price_tnd, badge, account_type, duration_label, delivery_hours, fulfillment_type)
VALUES
  ('netflix-premium-1m', 'Netflix Premium', 'Netflix', 'streaming', 'Ultra HD 4K streaming on 4 screens simultaneously. Private account.', 25.000, 'POPULAR', 'private', '1 Month', 2, 'gift_card'),
  ('chatgpt-plus-1m', 'ChatGPT Plus', 'OpenAI', 'ai_tools', 'GPT-4o access with priority responses and advanced features.', 65.000, 'POPULAR', 'private', '1 Month', 2, 'giftable_subscription'),
  ('spotify-family-1m', 'Spotify Family', 'Spotify', 'streaming', 'Up to 6 accounts, offline listening, no ads.', 18.000, 'INSTANT', 'shared', '1 Month', 1, 'account_setup'),
  ('canva-pro-1m', 'Canva Pro', 'Canva', 'productivity', 'Unlimited templates, brand kit, background remover and more.', 45.000, 'POPULAR', 'private', '1 Month', 2, 'account_setup'),
  ('youtube-premium-1m', 'YouTube Premium', 'Google', 'streaming', 'Ad-free YouTube, background play, YouTube Music included.', 22.000, 'INSTANT', 'private', '1 Month', 2, 'gift_card'),
  ('adobe-cc-1m', 'Adobe Creative Cloud', 'Adobe', 'productivity', 'Full suite: Photoshop, Illustrator, Premiere Pro and more.', 120.000, NULL, 'private', '1 Month', 4, 'account_setup')
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS schema_migrations (
  key        VARCHAR(120) PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE key = 'fulfillment_seed_v1') THEN
    UPDATE products SET fulfillment_type = 'gift_card' WHERE slug IN ('netflix-premium-1m', 'youtube-premium-1m') AND fulfillment_type = 'account_setup';
    UPDATE products SET fulfillment_type = 'giftable_subscription' WHERE slug = 'chatgpt-plus-1m' AND fulfillment_type = 'account_setup';
    INSERT INTO schema_migrations (key) VALUES ('fulfillment_seed_v1');
  END IF;
END $$;
