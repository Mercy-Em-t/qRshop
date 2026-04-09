-- =============================================================
-- UNIFIED ACTIVATE: wholesale2@qrshop.com
-- =============================================================
-- This script does TWO things:
-- 1. Force-confirms the email (bypass email link)
-- 2. Links the account to the Wholesale Shop
-- =============================================================

DO $$ 
DECLARE
  new_uid UUID;
  target_shop_id UUID := 'd0dbf20e-1134-46c5-9c9d-c4e1a8f0d882';
  target_email TEXT := 'wholesale2@qrshop.com';
BEGIN
  -- 1. Get the ID of the user created via SDK
  SELECT id INTO new_uid FROM auth.users WHERE email = target_email;

  IF new_uid IS NOT NULL THEN
    -- 2. FORCE CONFIRMation
    UPDATE auth.users 
    SET email_confirmed_at = now(),
        last_sign_in_at = now(),
        updated_at = now()
    WHERE id = new_uid;

    -- 3. LINKage in shop_users
    INSERT INTO public.shop_users (id, shop_id, email, role)
    VALUES (new_uid, target_shop_id, target_email, 'merchant')
    ON CONFLICT (id) DO UPDATE SET shop_id = EXCLUDED.shop_id, role = 'merchant';

    -- 4. Onboarding Status
    UPDATE public.shops 
    SET needs_password_change = true,
        kyc_completed = false
    WHERE id = target_shop_id;

    RAISE NOTICE 'SUCCESS: % (%) activated and linked to shop %', target_email, new_uid, target_shop_id;
  ELSE
    RAISE NOTICE 'ERROR: Could not find user with email %. Did you run the provisioner first?', target_email;
  END IF;
END $$;
