-- ECOSYSTEM REPAIR: Adding missing columns required by the new Master Admin frontend
-- This ensures the UI renders correctly without "406 Not Acceptable" errors

ALTER TABLE IF EXISTS shops 
ADD COLUMN IF NOT EXISTS needs_password_change BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS kyc_completed BOOLEAN DEFAULT FALSE;

-- 2. Businesses View (Rebuilt to absolute latest schema)
DROP VIEW IF EXISTS businesses CASCADE;
CREATE OR REPLACE VIEW businesses AS
SELECT 
    id, name, subdomain as slug, api_key, brain_file, 
    credits, chat_limit, sync_mode, sync_status, 
    sync_error, sync_last_synced_at, sync_updated_at, 
    needs_password_change, kyc_completed,
    created_at
FROM shops;

-- Permissions Refresh
GRANT SELECT ON businesses TO authenticated;
