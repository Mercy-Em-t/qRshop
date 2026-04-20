-- DOWNGRADE MASTER ROLE
-- Resolves security breach by moving emmercy65@gmail.com to shop_owner role.

BEGIN;

-- 1. Correct the role in all linked shops
UPDATE public.shop_users
SET role = 'shop_owner'
WHERE email = 'emmercy65@gmail.com';

-- 2. Ensure their main shop is flagged for merchant operations
-- This is already the case, but we confirm they are shop owners.

COMMIT;
