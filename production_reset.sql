-- PRODUCTION RESET SCRIPT
-- WARNING: This will permanently delete transactional data and non-essential shop records.
-- Use this to transition from Test to Live.

-- 1. UNLINK DATA (To avoid Foreign Key violations)
TRUNCATE public.order_items CASCADE;
TRUNCATE public.orders CASCADE;
TRUNCATE public.events CASCADE;
TRUNCATE public.shop_reviews CASCADE;
TRUNCATE public.shop_reports CASCADE;
TRUNCATE public.delivery_logs CASCADE;
TRUNCATE public.delivery_batches CASCADE;
TRUNCATE public.system_audit_logs CASCADE;
TRUNCATE public.payment_audit_log CASCADE;

-- 2. RESET SHOPS & USERS
-- This wipes all test shops and users. 
-- You will need to re-provision your Production Admin after this.
TRUNCATE public.shop_users CASCADE;
TRUNCATE public.shops CASCADE;

-- 3. KEEP INFRASTRUCTURE (Uncomment if you want to wipe these too)
-- TRUNCATE public.system_logistics_config CASCADE;
-- TRUNCATE public.industry_types CASCADE;
-- TRUNCATE public.agents CASCADE;

-- 4. RE-SEED PRODUCTION ADMIN
-- Replace 'your-admin@email.com' with your REAL live administrator email.
-- Note: You must also create this user in Supabase Auth dashboard.
-- INSERT INTO public.shop_users (email, role) 
-- VALUES ('your-admin@email.com', 'system_admin');

-- 5. VACUUM (Optional: Reclaims space, usually handled by Supabase)
-- VACUUM ANALYZE;
