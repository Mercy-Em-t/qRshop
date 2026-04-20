-- LEGACY SHIM: RESTORE shops.id
-- This allows legacy triggers, views, and libraries to function while we transition to shop_id.

BEGIN;

-- 1. Create a generated column that mirrors shop_id
-- If 'id' already exists but is the wrong type or name, we handle it.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'id') THEN
        ALTER TABLE public.shops ADD COLUMN id UUID GENERATED ALWAYS AS (shop_id) STORED;
    END IF;
END $$;

COMMIT;
