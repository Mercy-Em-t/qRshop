-- =============================================================
-- CRITICAL CLEANUP: Purge Stale Wholesale User
-- =============================================================
-- The SDK provisioning failed because the email already exists
-- in a "broken" state from previous manual SQL attempts.
-- Run this to clear the path for a clean SDK signup.
-- =============================================================

DO $$
DECLARE
  target_email TEXT := 'wholesale@qrshop.com';
  stale_uid UUID;
BEGIN
  -- 1. Find the user ID
  SELECT id INTO stale_uid FROM auth.users WHERE email = target_email;

  IF stale_uid IS NOT NULL THEN
    -- 2. Delete from public tables first (due to FKs)
    DELETE FROM public.shop_users WHERE id = stale_uid;
    
    -- 3. Delete from auth.users (This also clears auth.identities via CASCADE)
    DELETE FROM auth.users WHERE id = stale_uid;

    RAISE NOTICE 'SUCCESS: Purged stale user % (%)', target_email, stale_uid;
  ELSE
    RAISE NOTICE 'NOTICE: No stale user found for %. Path is already clear.', target_email;
  END IF;
END $$;
