-- =============================================================
-- Add Edit/Rejection Reason Tracking to Orders
-- =============================================================
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS edit_reason TEXT;
