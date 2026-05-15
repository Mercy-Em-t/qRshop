-- =============================================================
-- SAVANNAH / SHOPQR — SUPABASE PRODUCTION LOCKDOWN: PART 2
-- SURGICAL CLEAN-SLATE POLICY WIPER & FINAL LOCKDOWN (v1.0)
-- Execute this in Supabase to wipe legacy/orphan permissive policies
-- on the 11 remaining leaking tables.
-- =============================================================

BEGIN;

-- -------------------------------------------------------------
-- PHASE 1: DYNAMIC POLICY WIPE
-- -------------------------------------------------------------
-- Scans pg_policies for the 11 leaking tables and dynamically 
-- drops EVERY SINGLE policy to ensure NO permissive legacy 
-- rules survive.
DO $$ 
DECLARE 
    target_tables TEXT[] := ARRAY[
        'businesses', 'orders', 'delivery_hubs', 'shop_revenue_stats', 
        'system_logistics_config', 'shop_financial_relationship', 
        'order_items', 'shop_daily_revenue', 'events', 
        'product_template_fields', 'system_config'
    ];
    tbl TEXT;
    pol RECORD;
    is_view BOOLEAN;
BEGIN
    FOREACH tbl IN ARRAY target_tables LOOP
        -- GRACEFUL CHECK: Ensure we do not try to set RLS on database VIEWS
        SELECT EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = tbl AND table_type = 'VIEW'
        ) INTO is_view;

        IF NOT is_view THEN
            FOR pol IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl) LOOP
                EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, tbl);
            END LOOP;
            -- Force re-enable RLS for valid Base Tables
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        END IF;
    END LOOP;
END $$;

-- -------------------------------------------------------------
-- PHASE 2: RECREATING SECURE-ONLY ACCESS RULES
-- -------------------------------------------------------------
-- The following tables must receive safe explicit policies to prevent app failures.
-- The other 8 tables remain strictly 'DENY ALL' to the public.

-- 2.1 ORDERS (Safe Isolation)
-- Customers can place orders, but ONLY shop owners or admins can read/list them.
CREATE POLICY "Anyone can place an order" ON public.orders 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Owners can see their shop orders" ON public.orders 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.shop_users WHERE id = auth.uid() AND shop_id = public.orders.shop_id)
    OR (SELECT role FROM public.shop_users WHERE id = auth.uid()) = 'system_admin'
);

-- 2.2 ORDER ITEMS (Bound to Orders)
CREATE POLICY "Public can view their ordered items" ON public.order_items
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = public.order_items.order_id)
);

-- 2.3 EVENTS & TELEMETRY (Insert-Only for Public)
CREATE POLICY "Insert-only for public telemetry" ON public.events 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Select-only for admins" ON public.events 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.shop_users WHERE id = auth.uid() AND role = 'system_admin')
);

COMMIT;
-- =============================================================
-- FINAL LOCKDOWN COMPLETE
-- Rerun node verify_production_hardening.mjs for 100% green score!
-- =============================================================
