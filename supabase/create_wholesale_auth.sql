-- =============================================================
-- Wholesale Shop Authentication Setup
-- =============================================================
-- This script creates a login for the Wholesale Shop
-- Shop Name: Global Wholesale Craft Supplies
-- Shop ID: d0dbf20e-1134-46c5-9c9d-c4e1a8f0d882
-- =============================================================

-- 1. Create the user in Supabase Auth (auth.users)
-- Note: We use a subquery to avoid duplicates if you run this twice.
DO $$
DECLARE
  new_user_id UUID := gen_random_uuid();
  target_email TEXT := 'wholesale@qrshop.com';
  target_pass TEXT := 'crafts2026';
  target_shop_id UUID := 'd0dbf20e-1134-46c5-9c9d-c4e1a8f0d882';
BEGIN
  -- Check if user already exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = target_email) THEN
    
    -- Insert into auth.users (Standard Supabase Auth internal table)
    -- We use crypt() for the password which is default for Supabase
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, aud, created_at, updated_at)
    VALUES (
      new_user_id,
      target_email,
      crypt(target_pass, gen_salt('bf')),
      now(),
      'authenticated',
      'authenticated',
      now(),
      now()
    );

    -- 2. Link the user to the shop in public.shop_users
    INSERT INTO public.shop_users (id, shop_id, email, role)
    VALUES (
      new_user_id,
      target_shop_id,
      target_email,
      'merchant'
    );

    RAISE NOTICE 'SUCCESS: User % created and linked to shop %', target_email, target_shop_id;
  ELSE
    RAISE NOTICE 'INFO: User % already exists. No changes made.', target_email;
  END IF;
END $$;
