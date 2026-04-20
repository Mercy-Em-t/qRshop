-- FINAL PLATFORM SYNCHRONIZATION (v3)
-- Hardened against missing columns and view dependencies.

BEGIN;

-- 1. DROP DEPENDENT VIEWS TEMPORARILY
DROP VIEW IF EXISTS public.businesses CASCADE;
DROP VIEW IF EXISTS public.products CASCADE;

-- 2. NORMALISE SHOPS
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'id') THEN
        ALTER TABLE public.shops RENAME COLUMN id TO shop_id;
    END IF;
END $$;

ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS needs_password_change BOOLEAN DEFAULT FALSE;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS kyc_completed BOOLEAN DEFAULT TRUE;

-- Clear flags
UPDATE public.shops SET needs_password_change = FALSE, kyc_completed = TRUE;

-- 3. NORMALISE MENU_ITEMS
-- Ensure image columns exist before view creation
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 4. RECREATE VIEWS
CREATE OR REPLACE VIEW public.businesses AS
SELECT 
    shop_id as id,
    shop_id,
    name,
    subdomain as slug,
    description,
    tagline,
    phone,
    address,
    needs_password_change,
    kyc_completed,
    created_at
FROM public.shops;

CREATE OR REPLACE VIEW public.products AS
SELECT 
    id,
    shop_id as business_id,
    name,
    description,
    price,
    category,
    image_url,
    created_at
FROM public.menu_items;

-- 5. RE-GRANT ACCESS
GRANT SELECT ON public.businesses TO authenticated, anon;
GRANT SELECT ON public.products TO authenticated, anon;

-- 6. MERCHANT ROLE FIX
UPDATE public.shop_users
SET role = 'shop_owner'
WHERE email = 'emmercy65@gmail.com';

COMMIT;
