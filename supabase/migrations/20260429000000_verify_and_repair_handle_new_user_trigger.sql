-- =============================================================
-- MIGRATION: Verify & Repair handle_new_user Trigger
-- =============================================================
-- Run this in the Supabase SQL Editor to:
-- 1. Ensure the trigger function exists and is correctly defined
-- 2. Ensure the trigger is attached to auth.users
-- 3. Backfill profiles for any auth.users who slipped through without one
-- =============================================================

-- 1. RECREATE the trigger function (idempotent)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, system_role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'user'
    )
    ON CONFLICT (id) DO NOTHING; -- Safe: won't overwrite existing profiles
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. RECREATE the trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. VERIFY the trigger exists (this will return 1 row if healthy)
-- Run this SELECT separately to confirm:
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE trigger_name = 'on_auth_user_created';

-- 4. BACKFILL: Create profiles for any auth.users who don't have one yet
-- This is the critical fix for legacy users who signed up before the trigger existed.
INSERT INTO public.profiles (id, display_name, system_role)
SELECT
    u.id,
    COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
    'user'
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- 5. REPORT: Show how many profiles exist vs auth.users (for verification)
-- Run this SELECT separately after the above to see the count:
-- SELECT
--     (SELECT COUNT(*) FROM auth.users) AS total_auth_users,
--     (SELECT COUNT(*) FROM public.profiles) AS total_profiles,
--     (SELECT COUNT(*) FROM auth.users u WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)) AS users_without_profile;
