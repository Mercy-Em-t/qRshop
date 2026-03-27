-- ==========================================
-- Promotions Supplier Support & RLS Fix
-- ==========================================

-- 1. Modify promotions table
ALTER TABLE IF EXISTS public.promotions ALTER COLUMN shop_id DROP NOT NULL;
ALTER TABLE IF EXISTS public.promotions ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE;

-- Add constraint to ensure a promo belongs to either a shop OR a supplier (not both/none)
ALTER TABLE IF EXISTS public.promotions DROP CONSTRAINT IF EXISTS promotions_owner_check;
ALTER TABLE IF EXISTS public.promotions ADD CONSTRAINT promotions_owner_check 
  CHECK ( (shop_id IS NOT NULL AND supplier_id IS NULL) OR (shop_id IS NULL AND supplier_id IS NOT NULL) );

-- 2. Modify promotion_items table
ALTER TABLE IF EXISTS public.promotion_items ALTER COLUMN menu_item_id DROP NOT NULL;
ALTER TABLE IF EXISTS public.promotion_items ADD COLUMN IF NOT EXISTS supplier_item_id UUID REFERENCES public.supplier_items(id) ON DELETE CASCADE;

-- Add constraint to ensure an item is either a menu_item OR a supplier_item
ALTER TABLE IF EXISTS public.promotion_items DROP CONSTRAINT IF EXISTS promo_item_type_check;
ALTER TABLE IF EXISTS public.promotion_items ADD CONSTRAINT promo_item_type_check 
  CHECK ( (menu_item_id IS NOT NULL AND supplier_item_id IS NULL) OR (menu_item_id IS NULL AND supplier_item_id IS NOT NULL) );

-- 3. Update RLS Policies for promotions
DROP POLICY IF EXISTS "Shop users can manage their promotions" ON public.promotions;
DROP POLICY IF EXISTS "Supplier users can manage their promotions" ON public.promotions;
DROP POLICY IF EXISTS "System admin can manage all promotions" ON public.promotions;

-- Policy for Shop Owners
CREATE POLICY "Shop users can manage their promotions"
  ON public.promotions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.shop_users
      WHERE shop_users.shop_id = promotions.shop_id
        AND shop_users.id = auth.uid()
    )
  );

-- Policy for Suppliers
CREATE POLICY "Supplier users can manage their promotions"
  ON public.promotions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.suppliers
      WHERE suppliers.id = promotions.supplier_id
        AND suppliers.owner_id = auth.uid()
    )
  );

-- Policy for System Admins
CREATE POLICY "System admin can manage all promotions"
  ON public.promotions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.shop_users
      WHERE shop_users.id = auth.uid()
        AND shop_users.role = 'system_admin'
    )
  );

-- 4. Update RLS Policies for promotion_items
DROP POLICY IF EXISTS "Shop users can manage their promotion items" ON public.promotion_items;
DROP POLICY IF EXISTS "Supplier users can manage their promotion items" ON public.promotion_items;
DROP POLICY IF EXISTS "System admin can manage all promotion items" ON public.promotion_items;

-- Policy for Shop Owners
CREATE POLICY "Shop users can manage their promotion items"
  ON public.promotion_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.promotions
      JOIN public.shop_users ON shop_users.shop_id = promotions.shop_id
      WHERE promotions.id = promotion_items.promotion_id
        AND shop_users.id = auth.uid()
    )
  );

-- Policy for Suppliers
CREATE POLICY "Supplier users can manage their promotion items"
  ON public.promotion_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.promotions
      JOIN public.suppliers ON suppliers.id = promotions.supplier_id
      WHERE promotions.id = promotion_items.promotion_id
        AND suppliers.owner_id = auth.uid()
    )
  );

-- Policy for System Admins
CREATE POLICY "System admin can manage all promotion items"
  ON public.promotion_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.shop_users
      WHERE shop_users.id = auth.uid()
        AND shop_users.role = 'system_admin'
    )
  );
