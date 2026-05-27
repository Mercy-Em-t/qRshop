-- =============================================================
-- SAVANNAH / SHOPQR — FIX ORDERS UPDATE RLS POLICY MIGRATION
-- =============================================================

-- 1. Grant explicit privileges on orders to authenticated users
GRANT UPDATE, SELECT ON public.orders TO authenticated;

-- 2. Drop any conflicting/previous update policies to avoid duplicates
DROP POLICY IF EXISTS "Merchants can update their shop orders" ON public.orders;

-- 3. Create the row-level security UPDATE policy for shop owners/members
CREATE POLICY "Merchants can update their shop orders"
ON public.orders FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.shop_users 
        WHERE id = auth.uid() 
          AND shop_id = public.orders.shop_id
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.shop_users 
        WHERE id = auth.uid() 
          AND shop_id = public.orders.shop_id
    )
);
