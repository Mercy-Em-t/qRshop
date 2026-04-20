-- Master Account Orchestration (Public Schema Only - REFINED)
-- Instructions: 
-- 1. Create the user 'emmercy65@gmail.com' in the Supabase Auth Dashboard first.
-- 2. Run this script to link the user to the master shops.

-- Mama Rosy
INSERT INTO public.shop_users (id, email, shop_id, role)
SELECT id, 'emmercy65@gmail.com', 'deada001-1111-4444-8888-deada0016666', 'shop_owner'
FROM auth.users 
WHERE email = 'emmercy65@gmail.com'
ON CONFLICT (id, shop_id) DO NOTHING;

-- Savannah Atelier
INSERT INTO public.shop_users (id, email, shop_id, role)
SELECT id, 'emmercy65@gmail.com', '1971e852-47b4-43fa-b77b-d90642273e95', 'shop_owner'
FROM auth.users 
WHERE email = 'emmercy65@gmail.com'
ON CONFLICT (id, shop_id) DO NOTHING;

-- Aura & Co.
INSERT INTO public.shop_users (id, email, shop_id, role)
SELECT id, 'emmercy65@gmail.com', '5442ce63-9c3d-45e7-bb22-35f04a698dfc', 'shop_owner'
FROM auth.users 
WHERE email = 'emmercy65@gmail.com'
ON CONFLICT (id, shop_id) DO NOTHING;
