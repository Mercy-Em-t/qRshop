-- =============================================================
-- Native Supabase Auth Setup: Wholesale Merchant
-- =============================================================
-- This script creates a native Supabase Auth user following the
-- "Admin provisioned, user updates" security policy.
-- =============================================================

DO $$
DECLARE
  -- CONFIGURATION
  target_email TEXT := 'wholesale@qrshop.com';
  temp_password TEXT := 'wholesale2026'; -- User will be forced to change this
  target_shop_id UUID := 'd0dbf20e-1134-46c5-9c9d-c4e1a8f0d882';
  
  -- INTERNAL VARS
  new_user_id UUID := gen_random_uuid();
  encrypted_pw TEXT;
BEGIN
  -- 1. Ensure pgcrypto is available for password hashing
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  
  -- 2. Hash the temporary password using bcrypt (standard for Supabase)
  encrypted_pw := crypt(temp_password, gen_salt('bf'));

  -- 3. Check if user already exists to prevent duplicates
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = target_email) THEN
    
    -- 4. INSERT INTO auth.users (Full Schema Compliance)
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_sent_at,
      is_super_admin,
      confirmed_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      target_email,
      encrypted_pw,
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      '',
      '',
      now(),
      FALSE,
      now()
    );

    -- 5. LINK to shop_users
    INSERT INTO public.shop_users (id, shop_id, email, role)
    VALUES (new_user_id, target_shop_id, target_email, 'merchant');

    -- 6. SET SECURITY POLICY FLAG
    -- Force the user to go through the "One-Time Security Setup" in OnboardingGate.jsx
    UPDATE public.shops 
    SET needs_password_change = true,
        kyc_completed = false
    WHERE id = target_shop_id;

    RAISE NOTICE 'SUCCESS: Native user % created. ID: %', target_email, new_user_id;
    RAISE NOTICE 'POLICY: User will be forced to change password and complete KYC on first login.';
  ELSE
    RAISE NOTICE 'NOTICE: User % already exists. No actions taken.', target_email;
  END IF;

END $$;
