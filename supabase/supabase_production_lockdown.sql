-- =============================================================
-- SAVANNAH / SHOPQR — SUPABASE PRODUCTION SECURITY LOCKDOWN
-- IDEMPOTENT HARDENING PLAYBOOK (v1.0)
-- Run this script in your Supabase SQL Editor to fix:
-- 1. rls_disabled_in_public
-- 2. sensitive_columns_exposed
-- =============================================================

BEGIN;

-- -------------------------------------------------------------
-- PHASE 1: GLOBAL RLS ENFORCEMENT
-- -------------------------------------------------------------
-- Dynamically loops through all user tables in public schema 
-- and forces Row-Level Security ON. Tables without an explicit 
-- policy will automatically inherit a restrictive 'DENY ALL' default.
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    RAISE NOTICE 'Enforcing global Row-Level Security across all public tables...';
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
    END LOOP;
END $$;

-- -------------------------------------------------------------
-- PHASE 2: RESOLVE SENSITIVE DATA EXPOSURE (COLUMN LOCKDOWN)
-- -------------------------------------------------------------

-- 2.1 Drop legacy plaintext password column if present (Native Auth replaces this)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='shop_users' AND column_name='password') THEN
        ALTER TABLE public.shop_users DROP COLUMN password;
        RAISE NOTICE 'Removed legacy password column from shop_users.';
    END IF;
END $$;

-- 2.2 Column-Level Security: Revoke SELECT permissions on raw keys/secrets
-- This prevents 'anon' and 'authenticated' roles from seeing these values via API.
-- If backend tasks require them, they must use service_role (bypasses RLS & grants).
-- Revoking SELECT privileges on highly sensitive API columns...
REVOKE SELECT (mpesa_passkey, api_key) ON public.shops FROM anon, authenticated;
REVOKE SELECT (needs_password_change) ON public.businesses FROM anon, authenticated;
REVOKE SELECT (client_phone, customer_email) ON public.orders FROM anon, authenticated;
REVOKE SELECT (owner_phone, owner_email, passport_photo_url, mpesa_phone) ON public.shop_kyc FROM anon, authenticated;
REVOKE SELECT (contact_email, contact_phone) ON public.suppliers FROM anon, authenticated;

-- -------------------------------------------------------------
-- PHASE 3: EXPLICIT PERMISSIVE ACCESS POLICIES
-- -------------------------------------------------------------
-- Clean, non-recursive policies to maintain app functionality.

-- 3.1 SHOPS (Protected Asset Mode)
-- Visible only if 'approved' in the marketplace, OR belonging to the logged-in merchant.
DROP POLICY IF EXISTS "Public can view marketplace shops" ON public.shops;
DROP POLICY IF EXISTS "Shops are protected assets" ON public.shops;
CREATE POLICY "Shops are protected assets" ON public.shops
FOR SELECT USING (
  marketplace_status = 'approved' 
  OR EXISTS (SELECT 1 FROM public.shop_users WHERE id = auth.uid() AND (shop_id = public.shops.id OR role = 'system_admin'))
);

-- 3.2 MENU ITEMS & CATALOG (Approved Only)
DROP POLICY IF EXISTS "Public can view marketplace products" ON public.menu_items;
CREATE POLICY "Public can view marketplace products" ON public.menu_items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.shops
    WHERE public.shops.id = public.menu_items.shop_id
      AND public.shops.marketplace_status = 'approved'
  )
  OR EXISTS (SELECT 1 FROM public.shop_users WHERE id = auth.uid() AND shop_id = public.menu_items.shop_id)
);

-- 3.3 PRODUCT IMAGES (Approved Only)
DROP POLICY IF EXISTS "Public can view marketplace product images" ON public.product_images;
CREATE POLICY "Public can view marketplace product images" ON public.product_images
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.menu_items
    JOIN public.shops ON public.shops.id = public.menu_items.shop_id
    WHERE public.menu_items.id = public.product_images.product_id
      AND public.shops.marketplace_status = 'approved'
  )
  OR auth.uid() IS NOT NULL
);

-- 3.4 TELEMETRY & ANALYTICS (Insert-Only for Public)
-- Allow anonymous devices to record scans and sessions, but never read others' logs.
DO $$ 
DECLARE
    telemetry_tables TEXT[] := ARRAY['events', 'visits', 'devices', 'sessions'];
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY telemetry_tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Insert-only for public telemetry" ON public.%I', tbl);
        EXECUTE format('CREATE POLICY "Insert-only for public telemetry" ON public.%I FOR INSERT WITH CHECK (true)', tbl);
        
        EXECUTE format('DROP POLICY IF EXISTS "Select-only for admins" ON public.%I', tbl);
        EXECUTE format('CREATE POLICY "Select-only for admins" ON public.%I FOR SELECT USING (EXISTS (SELECT 1 FROM public.shop_users WHERE id = auth.uid() AND role = ''system_admin''))', tbl);
    END LOOP;
END $$;

-- 3.5 CONSUMER INPUTS (Reports & Reviews)
-- Allow anyone to file a complaint/review, but locked from public reading.
DROP POLICY IF EXISTS "Public can submit reports" ON public.shop_reports;
CREATE POLICY "Public can submit reports" ON public.shop_reports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can submit reviews" ON public.shop_reviews;
CREATE POLICY "Public can submit reviews" ON public.shop_reviews FOR INSERT WITH CHECK (true);

-- 3.6 USER PROFILES & LOGINS (Strict Isolation)
DROP POLICY IF EXISTS "Users can see their own profile" ON public.shop_users;
CREATE POLICY "Users can see their own profile" ON public.shop_users FOR SELECT USING (auth.uid() = id);

-- 3.7 ORDERS & ITEMS (Isolated to Checkout Session / Shop Owners)
DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
CREATE POLICY "Anyone can place an order" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Owners can see their shop orders" ON public.orders;
CREATE POLICY "Owners can see their shop orders" ON public.orders 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.shop_users WHERE id = auth.uid() AND shop_id = public.orders.shop_id)
);

DROP POLICY IF EXISTS "Public can view their ordered items" ON public.order_items;
CREATE POLICY "Public can view their ordered items" ON public.order_items
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = public.order_items.order_id)
);

COMMIT;
-- =============================================================
-- LOCKDOWN COMPLETE
-- Refresh your Supabase Dashboard to see the warnings clear!
-- =============================================================
