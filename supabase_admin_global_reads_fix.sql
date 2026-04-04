-- =============================================================
-- Admin Global Access Read Patch (v2)
-- =============================================================
-- Problem: System Admins were unable to see any shops that weren't
-- 'approved' for the marketplace, and they couldn't see owner
-- profiles for shops they didn't own. 
-- =============================================================

-- 1. Grant System Admins the ability to view all shops regardless of status
DROP POLICY IF EXISTS "Allow system admins to read all shops" ON public.shops;
CREATE POLICY "Allow system admins to read all shops" 
ON public.shops 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.shop_users 
    WHERE public.shop_users.id = auth.uid() 
    AND public.shop_users.role = 'system_admin'
  )
);

-- 2. Grant System Admins the ability to view all shop users globally
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

-- Note: These policies ensure full infrastructure visibility for
-- authorized administrators while maintaining strict tenant isolation
-- for regular shop owners.
