-- =============================================================
-- System Admin Global Read Policies (RLS Override)
-- =============================================================
-- ShopQR Admins must be able to view all orders and products
-- globally to staff the AdminGlobalOrders and AdminGlobalProducts feeds.
-- =============================================================

-- 1. Unrestricted Read Access to Orders for System Admins
DROP POLICY IF EXISTS "Allow system_admin to read all orders" ON public.orders;
CREATE POLICY "Allow system_admin to read all orders"
ON public.orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shop_users 
    WHERE public.shop_users.id = auth.uid() 
    AND public.shop_users.role = 'system_admin'
  )
);

-- 2. Unrestricted Read Access to Menu Items for System Admins
DROP POLICY IF EXISTS "Allow system_admin to read all menu_items" ON public.menu_items;
CREATE POLICY "Allow system_admin to read all menu_items"
ON public.menu_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shop_users 
    WHERE public.shop_users.id = auth.uid() 
    AND public.shop_users.role = 'system_admin'
  )
);
