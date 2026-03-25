-- QR Platform Schema Repair v4
-- Run this in your Supabase SQL Editor to support the latest UI features

-- 1. Add missing Shop Identity columns
ALTER TABLE shops ADD COLUMN IF NOT EXISTS subdomain TEXT UNIQUE;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

-- 2. Add missing Shop Configuration columns (if not already present)
ALTER TABLE shops ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT true;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS offers_pickup BOOLEAN DEFAULT true;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS offers_delivery BOOLEAN DEFAULT false;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS offers_dine_in BOOLEAN DEFAULT true;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS offers_digital BOOLEAN DEFAULT false;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC DEFAULT 0;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS industry_type TEXT DEFAULT 'retail';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS marketplace_status TEXT DEFAULT 'not_listed';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS list_in_global_marketplace BOOLEAN DEFAULT true;

-- 3. Synchronize existing newly created shops
UPDATE shops SET 
  subdomain = lower(replace(name, ' ', '-')) 
WHERE subdomain IS NULL;

UPDATE shops SET 
  whatsapp_number = COALESCE(phone, whatsapp_number)
WHERE whatsapp_number IS NULL;
