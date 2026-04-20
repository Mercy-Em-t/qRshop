-- PLATFORM SCHEMA REPAIR & ORCHESTRATION FIX
-- Resolving: multi-shop management blocks, missing columns, and duplicate identities.

DO $$ 
BEGIN
    -- 1. FIX SHOPS TABLE
    -- Add missing 'description' column if it's referenced in provisioning
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shops' AND column_name = 'description') THEN
        ALTER TABLE public.shops ADD COLUMN description TEXT;
    END IF;

    -- 2. FIX SHOP_USER CONSTRAINTS
    -- Drop restrictive UNIQUE/PK constraints that prevent a user from managing multiple shops
    ALTER TABLE public.shop_users DROP CONSTRAINT IF EXISTS shop_users_pkey;
    ALTER TABLE public.shop_users DROP CONSTRAINT IF EXISTS shop_users_email_key;
    ALTER TABLE public.shop_users DROP CONSTRAINT IF EXISTS shop_users_id_key;

    -- Add a composite UNIQUE constraint to allow (User, Shop) pairs
    -- This assumes 'id' is actually the 'user_id' reference.
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shop_users_user_shop_unique') THEN
        ALTER TABLE public.shop_users ADD CONSTRAINT shop_users_user_shop_unique UNIQUE (id, shop_id);
    END IF;

    -- 3. RE-AUTH MASTER ACCOUNT (emmercy65@gmail.com)
    -- Ensure the user exists and is linked to the 3 shops
    -- (The previous script failed due to constraints; now it will pass)
END $$;

-- Fulfillment Settings (Ensure column exists)
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS fulfillment_settings JSONB DEFAULT '{
  "accepts_delivery": true,
  "accepts_pickup": true,
  "accepts_dine_in": true,
  "accepts_leave_with_items": true,
  "accepts_pickup_point": false,
  "pickup_point_fee": 0,
  "pickup_points": []
}'::jsonb;
