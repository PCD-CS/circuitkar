-- Phase 5 Migration: Review rejection state
-- Run in Supabase Dashboard → SQL Editor AFTER phase4_migration.sql

-- Add explicit rejected flag so pending/rejected can be distinguished
-- (previously both had is_approved = false with no way to tell them apart)
ALTER TABLE product_reviews
  ADD COLUMN IF NOT EXISTS is_rejected BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for fast pending/rejected queries
CREATE INDEX IF NOT EXISTS reviews_rejected_idx ON product_reviews (is_rejected) WHERE is_rejected = TRUE;
