-- =============================================================
-- FINAL LINKAGE: Connect wholesale1@qrshop.com to Shop
-- =============================================================
-- Use this to bridge the new native identity to the shop data.
-- =============================================================

DO $$ 
DECLARE
  new_uid UUID;
  target_shop_id UUID := 'd0dbf20e-1134-46c5-9c9d-c4e1a8f0d882';
  target_email TEXT := 'wholesale1@qrshop.com';
BEGIN
  -- 1. Get the ID of the user created via SDK
  SELECT id INTO new_uid FROM auth.users WHERE email = target_email;

  IF new_uid IS NOT NULL THEN
    -- 2. Insert/Update linkage in shop_users
    INSERT INTO public.shop_users (id, shop_id, email, role)
    VALUES (new_uid, target_shop_id, target_email, 'merchant')
    ON CONFLICT (id) DO UPDATE SET shop_id = EXCLUDED.shop_id, role = 'merchant';

    -- 3. Ensure shop onboarding flags are set for first-login experience
    UPDATE public.shops 
    SET needs_password_change = true,
        kyc_completed = false
    WHERE id = target_shop_id;

    RAISE NOTICE 'SUCCESS: Linked % (%) to shop %', target_email, new_uid, target_shop_id;
  ELSE
    RAISE NOTICE 'ERROR: Could not find user with email %. Did you run the provisioner first?', target_email;
  END IF;
END $$;
