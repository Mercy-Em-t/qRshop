-- 20260430000000_fix_product_images_rls_v2.sql
-- Ensure product_images table has correct RLS policies for V2 architecture

-- 1. Enable RLS
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- 2. Clean up legacy policies
DROP POLICY IF EXISTS "Public Read" ON public.product_images;
DROP POLICY IF EXISTS "Shop Owners Manage" ON public.product_images;
DROP POLICY IF EXISTS "Public can view marketplace product images" ON public.product_images;

-- 3. Create V2 Policies for product_images

-- Public Read: Anyone can see product images
CREATE POLICY "Public Read"
ON public.product_images FOR SELECT
TO anon, authenticated
USING (true);

-- Merchant Insert: Only members of the shop that owns the product
CREATE POLICY "Merchant Insert"
ON public.product_images FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.menu_items mi
    JOIN public.shop_members sm ON mi.shop_id = sm.shop_id
    WHERE mi.id = product_id
    AND sm.user_id = auth.uid()
    AND sm.is_active = true
  )
);

-- Merchant Update: Only members of the shop that owns the product
CREATE POLICY "Merchant Update"
ON public.product_images FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.menu_items mi
    JOIN public.shop_members sm ON mi.shop_id = sm.shop_id
    WHERE mi.id = product_id
    AND sm.user_id = auth.uid()
    AND sm.is_active = true
  )
);

-- Merchant Delete: Only members of the shop that owns the product
CREATE POLICY "Merchant Delete"
ON public.product_images FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.menu_items mi
    JOIN public.shop_members sm ON mi.shop_id = sm.shop_id
    WHERE mi.id = product_id
    AND sm.user_id = auth.uid()
    AND sm.is_active = true
  )
);

-- 4. V2 Policies for menu_items
-- (Ensuring these use shop_members instead of shop_users)
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Merchant Select" ON public.menu_items;
CREATE POLICY "Merchant Select"
ON public.menu_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_members.shop_id = public.menu_items.shop_id
    AND shop_members.user_id = auth.uid()
    AND shop_members.is_active = true
  )
);

DROP POLICY IF EXISTS "Merchant Insert" ON public.menu_items;
CREATE POLICY "Merchant Insert"
ON public.menu_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_members.shop_id = public.menu_items.shop_id
    AND shop_members.user_id = auth.uid()
    AND shop_members.is_active = true
  )
);

DROP POLICY IF EXISTS "Merchant Update" ON public.menu_items;
CREATE POLICY "Merchant Update"
ON public.menu_items FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_members.shop_id = public.menu_items.shop_id
    AND shop_members.user_id = auth.uid()
    AND shop_members.is_active = true
  )
);

DROP POLICY IF EXISTS "Merchant Delete" ON public.menu_items;
CREATE POLICY "Merchant Delete"
ON public.menu_items FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shop_members
    WHERE shop_members.shop_id = public.menu_items.shop_id
    AND shop_members.user_id = auth.uid()
    AND shop_members.is_active = true
  )
);

-- Public Read for marketplace
DROP POLICY IF EXISTS "Public Select" ON public.menu_items;
CREATE POLICY "Public Select"
ON public.menu_items FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- 5. CRITICAL BACKFILL (V1 -> V2)
-- Ensure all legacy shop_users are registered in shop_members so they pass RLS checks
INSERT INTO public.shop_members (user_id, shop_id, role, is_active)
SELECT id, shop_id, role, true
FROM public.shop_users
ON CONFLICT (user_id, shop_id) DO NOTHING;
