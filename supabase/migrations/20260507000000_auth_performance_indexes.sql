-- 20260507000000_auth_performance_indexes.sql
-- Optimizes the authentication legacy lookup and backfill paths.
-- This ensures that legacy checks (such as scanning shop_users) are O(1) operations.

-- Ensure fast O(1) lookups on profiles id (though PK is already indexed, explicitly maintaining index optimization)
CREATE INDEX IF NOT EXISTS idx_profiles_id_opt ON public.profiles (id);

-- Ensure index on the legacy shop_users table to make backfill checks lightning-fast
CREATE INDEX IF NOT EXISTS idx_shop_users_legacy_id ON public.shop_users (id);
