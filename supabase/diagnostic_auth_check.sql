-- =============================================================
-- DIAGNOSTIC: Check Auth Table Structure
-- =============================================================
-- Run this to see how working users are stored in your database
-- so we can match the exact structure.
-- =============================================================

SELECT 
  id, 
  email, 
  encrypted_password, 
  instance_id, 
  aud, 
  role, 
  raw_app_meta_data, 
  raw_user_meta_data,
  email_confirmed_at
FROM auth.users 
WHERE email_confirmed_at IS NOT NULL
LIMIT 1;
