-- =============================================================
-- Order Data Enrichment Migration
-- =============================================================
-- This migration safely adds the customer identity and 
-- fulfillment tracking columns to the orders table.
-- It resolves the "column does not exist" error during checkout.
-- =============================================================

ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS client_phone TEXT,
  ADD COLUMN IF NOT EXISTS parent_order_id UUID REFERENCES public.orders(id),
  ADD COLUMN IF NOT EXISTS fulfillment_type TEXT DEFAULT 'dine_in',
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS delivery_fee_charged DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS coupon_code TEXT;

-- Optional: Ensure order_items can handle any potential cascade deletes
-- if parent orders are ever purged.
