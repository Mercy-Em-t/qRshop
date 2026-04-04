-- =============================================================
-- FINAL AUTH & VISIBILITY PATCH (v3)
-- =============================================================
-- This patch addresses:
-- 1. "User profile missing" login failures for new accounts.
-- 2. "No parallel shop spaces" visibility failures for admins.
-- =============================================================

-- PHASE 1: SHOP_USERS POLICY UPGRADE
-- We must allow users to read their own profile, otherwise login will fail!
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.shop_users;
CREATE POLICY "Allow users to read their own profile" 
ON public.shop_users 
FOR SELECT 
USING (auth.uid() = id);

-- We also grant System Admins the ability to view all profiles globally
DROP POLICY IF EXISTS "Allow system admins to read all shop users" ON public.shop_users;
CREATE POLICY "Allow system admins to read all shop users" 
ON public.shop_users 
FOR SELECT 
USING (
  (SELECT role FROM public.shop_users WHERE id = auth.uid()) = 'system_admin'
);


-- PHASE 2: SHOPS POLICY UPGRADE
-- Every user must be able to see the specific shop they are linked to.
DROP POLICY IF EXISTS "Allow users to read their own shop" ON public.shops;
CREATE POLICY "Allow users to read their own shop" 
ON public.shops 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.shop_users 
    WHERE public.shop_users.id = auth.uid() 
    AND (
      public.shop_users.shop_id = public.shops.shop_id 
      OR public.shop_users.shop_id = public.shops.id -- Support for both schema names
    )
  )
);

-- Grant System Admins unrestricted read access to ALL shops
DROP POLICY IF EXISTS "Allow system admins to read all shops" ON public.shops;
CREATE POLICY "Allow system admins to read all shops" 
ON public.shops 
FOR SELECT 
USING (
  (SELECT role FROM public.shop_users WHERE id = auth.uid()) = 'system_admin'
);


-- PHASE 3: DATABASE CLEANUP (Recommended)
-- If a shop was created with a NULL shop_link, but the owner email matches, 
-- this query attempts to manually bridge the gap for any existing "broken" accounts.
UPDATE public.shop_users 
SET shop_id = (SELECT shop_id FROM public.shops WHERE name = 'Your Broken Shop Name Here' LIMIT 1)
WHERE shop_id IS NULL AND role = 'shop_owner';
-- Note: Replace 'Your Broken Shop Name Here' if you need a manual fix for one specific shop.
