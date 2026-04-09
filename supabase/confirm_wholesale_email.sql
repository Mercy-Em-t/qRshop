-- =============================================================
-- FORCE CONFIRM: wholesale1@qrshop.com (V2)
-- =============================================================
-- This version respects the "generated column" constraint on
-- confirmed_at. We ONLY update email_confirmed_at.
-- =============================================================

UPDATE auth.users 
SET 
  email_confirmed_at = now(),
  last_sign_in_at = now(),
  updated_at = now()
WHERE email = 'wholesale1@qrshop.com';
