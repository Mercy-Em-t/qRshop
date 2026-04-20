-- Identity Merge & Cleanup for Whitney (Public Schema Only - REFINED)
-- Instructions: 
-- 1. In Supabase Dashboard -> Auth: Delete 'amoitwhitney21@gmail.com' (if messed up).
-- 2. In Supabase Dashboard -> Auth: Change 'amoitwhitney211@gmail.com' email to 'amoitwhitney21@gmail.com'.
-- 3. Run this script to consolidate shop_user links.

-- Update any shop links that were pointing to the 'temp' or 'messy' email address
UPDATE public.shop_users 
SET id = sub.id, email = 'amoitwhitney21@gmail.com'
FROM (SELECT id FROM auth.users WHERE email = 'amoitwhitney21@gmail.com') as sub
WHERE public.shop_users.email IN ('amoitwhitney211@gmail.com', 'amoitwhitney21@gmail.com');
