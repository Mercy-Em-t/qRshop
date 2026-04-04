-- =============================================================
-- Admin Global Profile Read Patch
-- =============================================================
-- Problem: System Admins were unable to see the owner records
-- of shops they didn't own, resulting in an "Unclaimed" display 
-- in the Global Infrastructure dashboard.
-- =============================================================

-- 1. Grant System Admins the ability to view all shop users globally
DROP POLICY IF EXISTS "Allow system admins to read all shop users" ON public.shop_users;
CREATE POLICY "Allow system admins to read all shop users" 
ON public.shop_users 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.shop_users 
    WHERE public.shop_users.id = auth.uid() 
    AND public.shop_users.role = 'system_admin'
  )
);

-- Note: This ensures that when the dashboard performs a join from 
-- 'shops' to 'shop_users', the data is not silently filtered by RLS.
