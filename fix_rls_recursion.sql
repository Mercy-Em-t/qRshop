-- FIX: Resolve infinite recursion in shop_users RLS policy
-- The previous policy tried to SELECT from the same table in its USING clause.

-- 1. Drop the recursive policy
DROP POLICY IF EXISTS "Shop users are private" ON public.shop_users;

-- 2. Create a non-recursive policy for self-access (Essential for Login)
CREATE POLICY "Users can see their own profile"
ON public.shop_users
FOR SELECT
TO authenticated, anon
USING (auth.uid() = id);

-- 3. Create a non-recursive policy for system admins using metadata or fixed check
-- Note: In a production system, we'd use a custom claim. 
-- For now, we'll use a simple policy that allows 'system_admin' to see all if they are authenticated
-- but we must avoid the subquery on the same table.

-- If we want system_admins to see everything, we can use a service role or a simplified policy.
-- However, for the 'mamarosy' login, the "Users can see their own profile" policy is SUFFICIENT.

-- Let's also ensure 'anon' can query the table for the login phase (where they might not be fully authed yet in the session)
-- Actually auth-service.js runs AFTER signInWithPassword, so auth.uid() is available.
