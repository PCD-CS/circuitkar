-- Phase 4 Migration: Coupons, Reviews, Wishlist, HSN codes
-- Run in Supabase Dashboard → SQL Editor AFTER phase3_migration.sql

-- ── Coupons ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS coupons (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code                TEXT        NOT NULL UNIQUE,
  description         TEXT,
  discount_type       TEXT        NOT NULL CHECK (discount_type IN ('percentage','flat')),
  discount_value      NUMERIC     NOT NULL CHECK (discount_value > 0),
  max_discount_amount NUMERIC,               -- cap for percentage coupons
  min_order_value     NUMERIC DEFAULT 0,     -- minimum subtotal to apply
  usage_limit         INTEGER,               -- total uses allowed (NULL = unlimited)
  per_user_limit      INTEGER DEFAULT 1,     -- uses per customer
  usage_count         INTEGER NOT NULL DEFAULT 0,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  starts_at           TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coupons_code_idx ON coupons (code);
CREATE INDEX IF NOT EXISTS coupons_active_idx ON coupons (is_active, expires_at);

-- Add coupon fields to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code     TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

-- ── Product Reviews ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS product_reviews (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id    UUID        REFERENCES orders(id) ON DELETE SET NULL,
  rating      SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title       TEXT,
  body        TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,  -- verified purchase
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,  -- admin approval before showing
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- One review per customer per product
  UNIQUE (product_id, customer_id)
);

CREATE INDEX IF NOT EXISTS reviews_product_idx  ON product_reviews (product_id, is_approved);
CREATE INDEX IF NOT EXISTS reviews_customer_idx ON product_reviews (customer_id);

-- ── Wishlist ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wishlists (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id  UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (customer_id, product_id)
);

CREATE INDEX IF NOT EXISTS wishlists_customer_idx ON wishlists (customer_id);

-- ── HSN codes + tax on products ───────────────────────────────────────────────

ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn_code  TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_rate   NUMERIC DEFAULT 18;   -- GST %
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price NUMERIC;              -- for margin tracking

-- ── Settings defaults ─────────────────────────────────────────────────────────

INSERT INTO settings (key, value) VALUES ('review_moderation', 'true') ON CONFLICT (key) DO NOTHING;

-- ── RLS Policies (enable if RLS is on) ───────────────────────────────────────

-- Reviews: anyone can read approved reviews; auth users can insert their own
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_reviews" ON product_reviews;
CREATE POLICY "public_read_reviews" ON product_reviews FOR SELECT
  USING (is_approved = TRUE);

DROP POLICY IF EXISTS "auth_insert_review" ON product_reviews;
CREATE POLICY "auth_insert_review" ON product_reviews FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "auth_update_own_review" ON product_reviews;
CREATE POLICY "auth_update_own_review" ON product_reviews FOR UPDATE
  USING (auth.uid() = customer_id);

-- Wishlist: users can only see/manage their own
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_wishlist" ON wishlists;
CREATE POLICY "own_wishlist" ON wishlists FOR ALL
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);
