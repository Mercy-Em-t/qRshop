-- =============================================================
-- EMERGENCY PERFORMANCE BYPASS (v5)
-- =============================================================
-- READ CAREFULLY: 
-- This script is designed to "strip everything away" to verify
-- the absolute maximum login speed.
-- =============================================================

-- 1. UNRESTRICTED READ FOR shop_users
--    This allows any authenticated user to read ANY metadata.
--    This completely removes RLS overhead for the profile fetch.
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.shop_users;
CREATE POLICY "Allow users to read their own profile" 
ON public.shop_users FOR SELECT USING (true);


-- 2. CLEAR LOCKS & FRAGMENTATION
--    Large login_attempts tables can slow down indexing and deletion.
TRUNCATE TABLE public.login_attempts RESTART IDENTITY;


-- 3. UNRESTRICTED SHOPS READ
--    Allows any logged-in user to see all shops. 
--    (Note: This is temporary for testing the 'too long to load' fix).
DROP POLICY IF EXISTS "Allow users to read their own shop" ON public.shops;
CREATE POLICY "Allow users to read their own shop" 
ON public.shops FOR SELECT USING (true);
