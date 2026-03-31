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
  active           BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Orders ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_ref           VARCHAR(20) UNIQUE NOT NULL,   -- e.g. LB-82941
  user_id             UUID REFERENCES users(id),
  product_id          UUID REFERENCES products(id),
  status              VARCHAR(30) DEFAULT 'pending_payment',
  -- statuses: draft | pending_payment | payment_failed | paid | processing | fulfilled | cancelled | refunded | flagged
  amount_tnd          NUMERIC(10, 3) NOT NULL,
  gateway             VARCHAR(30),                   -- flouci | paymee
  gateway_payment_id  VARCHAR(255),
  delivery_email      VARCHAR(255) NOT NULL,
  delivery_phone      VARCHAR(30),
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
  full_name   VARCHAR(255) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  subject     VARCHAR(255),
  category    VARCHAR(100),
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
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ─── Password Reset Columns (safe to run on existing DB) ──
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(128);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ;

-- ─── Seed Products ────────────────────────────────────────
INSERT INTO products (slug, name, provider, category, description, price_tnd, badge, account_type, duration_label, delivery_hours)
VALUES
  ('netflix-premium-1m', 'Netflix Premium', 'Netflix', 'streaming', 'Ultra HD 4K streaming on 4 screens simultaneously. Private account.', 25.000, 'POPULAR', 'private', '1 Month', 2),
  ('chatgpt-plus-1m', 'ChatGPT Plus', 'OpenAI', 'ai_tools', 'GPT-4o access with priority responses and advanced features.', 65.000, 'POPULAR', 'private', '1 Month', 2),
  ('spotify-family-1m', 'Spotify Family', 'Spotify', 'streaming', 'Up to 6 accounts, offline listening, no ads.', 18.000, 'INSTANT', 'shared', '1 Month', 1),
  ('canva-pro-1m', 'Canva Pro', 'Canva', 'productivity', 'Unlimited templates, brand kit, background remover and more.', 45.000, 'POPULAR', 'private', '1 Month', 2),
  ('youtube-premium-1m', 'YouTube Premium', 'Google', 'streaming', 'Ad-free YouTube, background play, YouTube Music included.', 22.000, 'INSTANT', 'private', '1 Month', 2),
  ('adobe-cc-1m', 'Adobe Creative Cloud', 'Adobe', 'productivity', 'Full suite: Photoshop, Illustrator, Premiere Pro and more.', 120.000, NULL, 'private', '1 Month', 4)
ON CONFLICT (slug) DO NOTHING;
