-- EMERGENCY LOGIN RESTORATION
-- This migration fixes the authenticated profile fetch which is Currently blocking all user logins.

BEGIN;

-- 1. Ensure RLS is active on shop_users
ALTER TABLE public.shop_users ENABLE ROW LEVEL SECURITY;

-- 2. Drop any potentially broken policies
DROP POLICY IF EXISTS "Users can read own profiles" ON public.shop_users;
DROP POLICY IF EXISTS "Users can view own profiles" ON public.shop_users;
DROP POLICY IF EXISTS "Authenticated users can read their own profile row" ON public.shop_users;

-- 3. Create a clean, explicit read policy
CREATE POLICY "Users can view own profiles" 
ON public.shop_users 
FOR SELECT 
TO authenticated
USING (id = auth.uid());

-- 4. Verify Foreign Key relationship to shops (aligned with new shop_id column)
-- PostgREST depends on this for the fetch join: shops(name, subdomain)
ALTER TABLE public.shop_users DROP CONSTRAINT IF EXISTS shop_users_shop_id_fkey;
ALTER TABLE public.shop_users 
ADD CONSTRAINT shop_users_shop_id_fkey 
FOREIGN KEY (shop_id) 
REFERENCES public.shops(shop_id) 
ON DELETE CASCADE;

-- 5. Fix any legacy RLS on shops table that might block the join
DROP POLICY IF EXISTS "Authenticated users can view shop details" ON public.shops;
CREATE POLICY "Authenticated users can view shop details" 
ON public.shops 
FOR SELECT 
TO authenticated 
USING (true);

COMMIT;
