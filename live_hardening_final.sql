-- LIVE PRODUCTION HARDENING FINAL
-- Purpose: Permanently remove MVP leftovers and lock down data access.

-- 1. DATA SECURITY: REMOVE PLAINTEXT PASSWORDS
-- Authentication is now strictly handled by Supabase Native Auth.
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shop_users' AND column_name='password') THEN
        ALTER TABLE public.shop_users DROP COLUMN password;
    END IF;
END $$;

-- 2. TIGHTEN RLS: SHOPS
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on shops" ON public.shops;
DROP POLICY IF EXISTS "Public can view shops" ON public.shops;
CREATE POLICY "Public can view shops" ON public.shops FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can update their own shop" ON public.shops;
CREATE POLICY "Owners can update their own shop" ON public.shops 
FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.shop_users WHERE id = auth.uid() AND shop_id = public.shops.id)
);

-- 3. TIGHTEN RLS: MENU ITEMS
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Public can view menu items" ON public.menu_items;
CREATE POLICY "Public can view menu items" ON public.menu_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owners can manage menu items" ON public.menu_items;
CREATE POLICY "Owners can manage menu items" ON public.menu_items
FOR ALL USING (
    EXISTS (SELECT 1 FROM public.shop_users WHERE id = auth.uid() AND shop_id = public.menu_items.shop_id)
);

-- 4. TIGHTEN RLS: ORDERS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public insert on orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
CREATE POLICY "Anyone can place an order" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Owners can see their shop orders" ON public.orders;
CREATE POLICY "Owners can see their shop orders" ON public.orders 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.shop_users WHERE id = auth.uid() AND shop_id = public.orders.shop_id)
);

-- 5. CONSTRAINT HARDENING: PRICE/QUANTITY
ALTER TABLE public.menu_items DROP CONSTRAINT IF EXISTS check_positive_price;
ALTER TABLE public.menu_items ADD CONSTRAINT check_positive_price CHECK (price >= 0);

ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS check_positive_quantity;
ALTER TABLE public.order_items ADD CONSTRAINT check_positive_quantity CHECK (quantity > 0);

-- 6. AUDIT: ENSURE LOGS ARE IMMUTABLE
CREATE OR REPLACE FUNCTION public.prevent_audit_tampering()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_audit_immutable ON public.system_audit_logs;
CREATE TRIGGER tr_audit_immutable
BEFORE UPDATE OR DELETE ON public.system_audit_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_tampering();
