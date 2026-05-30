-- Phase 3 Migration: Order enhancements, inventory management
-- Run this in Supabase Dashboard → SQL Editor

-- ── Orders: new columns ──────────────────────────────────────────────────────

ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_test_order   BOOLEAN   DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_name     TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number  TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url     TEXT;
-- status_history stores [{status, timestamp, note}] entries
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_history   JSONB     DEFAULT '[]'::jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS accepted_at      TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS packed_at        TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at       TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at     TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS cancelled_at     TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS daily_sequence   INTEGER;

-- ── Settings: order number prefix + low stock threshold ──────────────────────

INSERT INTO settings (key, value) VALUES ('order_number_prefix', 'CK')        ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('low_stock_threshold', '5')         ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('shipping_charge', '100')           ON CONFLICT (key) DO NOTHING;

-- ── Inventory events audit log ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS inventory_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id      UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  event_type      TEXT        NOT NULL CHECK (event_type IN ('sale','cancel','restock','adjustment')),
  quantity_change INTEGER     NOT NULL,   -- negative = stock removed, positive = stock added
  reference_id    TEXT,                   -- order_number or other reference
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS inventory_events_product_idx ON inventory_events (product_id);
CREATE INDEX IF NOT EXISTS inventory_events_created_idx ON inventory_events (created_at DESC);

-- ── Indexes for order queries ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS orders_created_at_idx     ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx         ON orders (status);
CREATE INDEX IF NOT EXISTS orders_daily_seq_idx      ON orders (daily_sequence);
