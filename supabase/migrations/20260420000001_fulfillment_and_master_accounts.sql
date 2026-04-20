-- =============================================================
-- Migration: Advanced Fulfillment & Master Account Orchestration
-- =============================================================

-- 1. Expand Shops Table with Advanced Fulfillment Settings
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS fulfillment_settings JSONB DEFAULT '{
  "accepts_delivery": true,
  "accepts_pickup": true,
  "accepts_dine_in": true,
  "accepts_leave_with_items": true,
  "accepts_pickup_point": false,
  "pickup_point_fee": 0,
  "pickup_points": []
}'::jsonb;

-- 2. Ensure Fulfillment Type Enum/Check (Optional, but good for consistency)
-- For now, we'll rely on application-level logic to map these to 'fulfillment_type' column.

-- 3. Provision Master User Account
-- We'll assume the user's email exists or we create a placeholder if needed.
-- Looking for a user that should manage these shops.
-- (Note: In a real environment, we'd use the current user's ID)

-- 4. Create "TheHobby" Shop
INSERT INTO public.shops (name, industry_type)
VALUES ('TheHobby', 'retail')
ON CONFLICT DO NOTHING;

-- 5. Link Master Account to Shops
-- We need the user_id. For this script, we'll try to find an admin or the first user.
-- Since I don't have the user's ID directly in this tool, I'll provide the logic.
-- USER: Please run the following to link your shops:
/*
DO $$
DECLARE
    target_user_id UUID;
    mamarosy_id UUID;
    aura_id UUID;
    savannah_id UUID;
    hobby_id UUID;
BEGIN
    -- Get your user ID (replace with your actual ID or let system find it)
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'YOUR_EMAIL' LIMIT 1;
    
    -- Get Shop IDs
    SELECT shop_id INTO mamarosy_id FROM public.shops WHERE name ILIKE '%MamaRosy%' LIMIT 1;
    SELECT shop_id INTO aura_id FROM public.shops WHERE name ILIKE '%Aura%' LIMIT 1;
    SELECT shop_id INTO savannah_id FROM public.shops WHERE name ILIKE '%Savannah Atelier%' LIMIT 1;
    SELECT shop_id INTO hobby_id FROM public.shops WHERE name = 'TheHobby' LIMIT 1;

    -- Link them in shop_users
    INSERT INTO public.shop_users (id, shop_id, role)
    VALUES 
        (target_user_id, mamarosy_id, 'owner'),
        (target_user_id, aura_id, 'owner'),
        (target_user_id, savannah_id, 'owner'),
        (target_user_id, hobby_id, 'owner')
    ON CONFLICT (id, shop_id) DO UPDATE SET role = 'owner';
END $$;
*/
