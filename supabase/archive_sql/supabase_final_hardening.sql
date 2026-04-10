-- FINAL SYSTEM HARDENING & PERFORMANCE AUDIT
-- 1. Indexing all Foreign Keys to prevent Sequential Scans (Latency O(n) -> O(log n))
CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON public.orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_shop_id ON public.menu_items(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_users_role ON public.shop_users(role);
CREATE INDEX IF NOT EXISTS idx_delivery_batches_hub_id ON public.delivery_batches(hub_id);
CREATE INDEX IF NOT EXISTS idx_delivery_batches_rider_id ON public.delivery_batches(rider_id);

-- 2. Performance Tuning for Public Reads
CREATE INDEX IF NOT EXISTS idx_shops_marketplace_status ON public.shops(marketplace_status);

-- 3. RLS Safety Check: Ensure all critical tables have RLS enabled
ALTER TABLE IF EXISTS public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;

-- 4. Constraint Hardening
-- Prevents negative prices or quantities from being injected via API
ALTER TABLE public.menu_items DROP CONSTRAINT IF EXISTS check_positive_price;
ALTER TABLE public.menu_items ADD CONSTRAINT check_positive_price CHECK (price >= 0);

ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS check_positive_quantity;
ALTER TABLE public.order_items ADD CONSTRAINT check_positive_quantity CHECK (quantity > 0);

-- 5. Cleanup: Remove any orphaned RLS policies referencing 'profiles'
DROP POLICY IF EXISTS "Users can see their own profile" ON public.shop_users;
CREATE POLICY "Users can see their own profile" ON public.shop_users
FOR SELECT USING (auth.uid() = id);
