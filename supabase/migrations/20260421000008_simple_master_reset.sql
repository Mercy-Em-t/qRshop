-- SIMPLE PASSWORD RESET FOR MASTER
-- Target: emmercy65@gmail.com

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
BEGIN
    SET search_path TO public, auth, extensions;
    
    -- Update existing user password
    UPDATE auth.users 
    SET encrypted_password = crypt('Savannah2026!Master', gen_salt('bf')),
        email_confirmed_at = NOW(),
        updated_at = NOW()
    WHERE email = 'emmercy65@gmail.com';
    
    -- Ensure Admin Role Escalation
    UPDATE public.shop_users
    SET role = 'system_admin'
    WHERE email = 'emmercy65@gmail.com';
END $$;
