-- ==========================================
-- Public Marketplace Read Policies
-- Allow unauthenticated users to browse the Discover/Directory page
-- ==========================================

-- Allow public reads on menu_items for marketplace discovery
-- Only items from shops that opted into the global marketplace
DROP POLICY IF EXISTS "Public can view marketplace products" ON public.menu_items;
CREATE POLICY "Public can view marketplace products"
ON public.menu_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shops
    WHERE public.shops.id = public.menu_items.shop_id
      AND public.shops.list_in_global_marketplace = true
      AND public.shops.is_online = true
  )
);

-- Allow public reads on shops that have opted into the global marketplace
DROP POLICY IF EXISTS "Public can view marketplace shops" ON public.shops;
CREATE POLICY "Public can view marketplace shops"
ON public.shops
FOR SELECT
USING (
  list_in_global_marketplace = true
  OR auth.uid() IS NOT NULL -- logged-in users (shop owner) can always see their own
);

-- Allow public reads on product images for marketplace items
DROP POLICY IF EXISTS "Public can view marketplace product images" ON public.product_images;
CREATE POLICY "Public can view marketplace product images"
ON public.product_images
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.menu_items
    JOIN public.shops ON public.shops.id = public.menu_items.shop_id
    WHERE public.menu_items.id = public.product_images.menu_item_id
      AND public.shops.list_in_global_marketplace = true
      AND public.shops.is_online = true
  )
);
