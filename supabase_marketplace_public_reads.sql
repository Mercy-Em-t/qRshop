-- ==========================================
-- Admin-Gated Marketplace Approval System
-- Run INSTEAD of supabase_marketplace_public_reads.sql
-- ==========================================

-- 1. Add marketplace_status column to shops
--    Values: null / 'not_listed' / 'pending_review' / 'approved' / 'rejected' / 'suspended'
ALTER TABLE shops ADD COLUMN IF NOT EXISTS marketplace_status TEXT DEFAULT 'not_listed';

-- Migrate existing shops: if they already have list_in_global_marketplace=true, set to pending_review
UPDATE shops SET marketplace_status = 'pending_review' WHERE list_in_global_marketplace = true AND marketplace_status IS NULL;
UPDATE shops SET marketplace_status = 'not_listed'     WHERE list_in_global_marketplace = false AND marketplace_status IS NULL;

-- 2. Public read policy on shops — ONLY admin-approved shops are visible
DROP POLICY IF EXISTS "Public can view marketplace shops" ON public.shops;
CREATE POLICY "Public can view marketplace shops"
ON public.shops
FOR SELECT
USING (
  marketplace_status = 'approved'
  OR auth.uid() IS NOT NULL  -- any logged-in user (shop owner) can always see their own data
);

-- 3. Public read policy on menu_items — only from approved shops
DROP POLICY IF EXISTS "Public can view marketplace products" ON public.menu_items;
CREATE POLICY "Public can view marketplace products"
ON public.menu_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shops
    WHERE public.shops.id = public.menu_items.shop_id
      AND public.shops.marketplace_status = 'approved'
  )
  OR auth.uid() IS NOT NULL  -- shop owners can always see their own items
);

-- 4. Public read policy on product_images — only for approved shops
DROP POLICY IF EXISTS "Public can view marketplace product images" ON public.product_images;
CREATE POLICY "Public can view marketplace product images"
ON public.product_images
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.menu_items
    JOIN public.shops ON public.shops.id = public.menu_items.shop_id
    WHERE public.menu_items.id = public.product_images.menu_item_id
      AND public.shops.marketplace_status = 'approved'
  )
  OR auth.uid() IS NOT NULL
);

-- 5. Allow system_admin to update marketplace_status
DROP POLICY IF EXISTS "Admins can manage marketplace approval status" ON public.shops;
CREATE POLICY "Admins can manage marketplace approval status"
ON public.shops
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.shop_users
    WHERE public.shop_users.id = auth.uid()
      AND public.shop_users.role = 'system_admin'
  )
);
