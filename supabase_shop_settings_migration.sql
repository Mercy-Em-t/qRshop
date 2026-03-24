-- Shop Settings Migration
-- Run this in your Supabase SQL Editor to support the new Merchant configurations

ALTER TABLE shops ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT true;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS offers_pickup BOOLEAN DEFAULT true;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS offers_delivery BOOLEAN DEFAULT false;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS offers_dine_in BOOLEAN DEFAULT true;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS offers_digital BOOLEAN DEFAULT false;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC DEFAULT 0;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS industry_type TEXT DEFAULT 'restaurant';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS list_in_global_marketplace BOOLEAN DEFAULT true;

-- Optional: ensure existing rows have sensible defaults
UPDATE shops SET 
  is_online = coalesce(is_online, true),
  offers_pickup = coalesce(offers_pickup, true),
  offers_delivery = coalesce(offers_delivery, false),
  offers_dine_in = coalesce(offers_dine_in, true),
  offers_digital = coalesce(offers_digital, false),
  delivery_fee = coalesce(delivery_fee, 0),
  industry_type = coalesce(industry_type, 'restaurant'),
  list_in_global_marketplace = coalesce(list_in_global_marketplace, true);
