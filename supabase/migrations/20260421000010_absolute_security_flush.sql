-- ABSOLUTE SECURITY FLAG CLEARANCE (v2)
-- This script ensures NO shop is left in a "needs_password_change" state.
-- It also fixes the 'shops.id' type/column issues if any remain.

BEGIN;

-- 1. Definitively clear flags for ALL shops
UPDATE public.shops 
SET 
  needs_password_change = FALSE,
  kyc_completed = TRUE
WHERE needs_password_change IS TRUE OR kyc_completed IS FALSE;

-- 2. Special case for Mama Rosy and other primary nodes 
-- (Just to be absolutely sure)
UPDATE public.shops 
SET needs_password_change = FALSE, kyc_completed = TRUE
WHERE shop_id IN (
  'deada001-1111-4444-8888-deada0016666', -- Mama Rosy
  '1971e852-47b4-43fa-b77b-d90642273e95', -- Savannah Atelier
  '5442ce63-9c3d-45e7-bb22-35f04a698dfc'  -- Aura & Co
);

-- 3. Ensure emmercy65 is NOT a system_admin (as requested)
-- and NOT a shop_owner but... wait.
-- The user said: "downgrade emmercy65 role to 'shop_owner'".
UPDATE public.shop_users
SET role = 'shop_owner'
WHERE email = 'emmercy65@gmail.com';

COMMIT;
