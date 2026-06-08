-- Migration to add Google Merchant settings to shops table
ALTER TABLE shops ADD COLUMN IF NOT EXISTS google_merchant_id TEXT;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS google_sync_enabled BOOLEAN DEFAULT false;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS google_last_sync_at TIMESTAMPTZ;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS google_sync_status TEXT;
