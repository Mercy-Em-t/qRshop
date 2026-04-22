-- FIX QR NODE SCHEMA: STANDARDIZE ACTION AND LOCATION
-- Resolves "undefined" QR nodes by adding missing columns and migrating action_type.

BEGIN;

-- 1. Add 'location' column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qrs' AND column_name = 'location') THEN
        ALTER TABLE public.qrs ADD COLUMN location TEXT;
    END IF;
END $$;

-- 2. Add 'action' column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'qrs' AND column_name = 'action') THEN
        ALTER TABLE public.qrs ADD COLUMN action TEXT DEFAULT 'open_menu';
    END IF;
END $$;

-- 3. Migrate data from 'action_type' to 'action' where 'action' is null (or default)
UPDATE public.qrs 
SET action = action_type 
WHERE action = 'open_menu' AND action_type IS NOT NULL AND action_type != 'open_menu';

-- 4. Ensure qr_id is TEXT (Wait, migration 20260421000015 already did this, but good to be safe)
ALTER TABLE public.qrs ALTER COLUMN qr_id TYPE TEXT;

COMMIT;
