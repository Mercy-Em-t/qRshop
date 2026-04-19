-- NUCLEAR FIX: Drop all policies on shop_users and recreate from scratch
-- This resolves the "Infinite Recursion detected" error.

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'shop_users') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.shop_users', pol.policyname);
    END LOOP;
END $$;

-- Enable RLS just in case it was toggled
ALTER TABLE public.shop_users ENABLE ROW LEVEL SECURITY;

-- Create the clean, non-recursive policy
CREATE POLICY "Users can see their own profile"
ON public.shop_users
FOR SELECT
TO authenticated, anon
USING (auth.uid() = id);

-- (Optional) If we want system admins to see all, we should use a custom claim or a separate table check.
-- For now, this is enough to let merchants login.
