-- Master Account Orchestration for emmercy65@gmail.com
-- This migration creates the user and links it to Mama Rosy, Savannah Atelier, and Aura & Co.

DO $$
DECLARE
    v_user_id UUID;
    v_target_id UUID := '88888888-8888-4444-9999-000000000000';
    v_password_hash TEXT := crypt('Savannah2026!Master', gen_salt('bf'));
BEGIN
    -- 0. Get ID if user exists
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'emmercy65@gmail.com' LIMIT 1;

    -- 1. Create the User in Auth Schema (if it doesn't exist)
    IF v_user_id IS NULL THEN
        v_user_id := v_target_id;

        INSERT INTO auth.users (
            id, 
            instance_id, 
            email, 
            encrypted_password, 
            email_confirmed_at, 
            raw_app_meta_data, 
            raw_user_meta_data, 
            created_at, 
            updated_at, 
            role, 
            aud,
            confirmation_token
        ) VALUES (
            v_user_id,
            '00000000-0000-0000-0000-000000000000',
            'emmercy65@gmail.com',
            v_password_hash,
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{"name": "Emmercy Master"}',
            NOW(),
            NOW(),
            'authenticated',
            'authenticated',
            ''
        );

        -- Also insert into auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            v_user_id,
            format('{"sub": "%s", "email": "%s"}', v_user_id, 'emmercy65@gmail.com')::jsonb,
            'email',
            NOW(),
            NOW(),
            NOW()
        );
    END IF;

    -- 2. Link User to Shops in public.shop_users
    -- Mama Rosy
    IF NOT EXISTS (SELECT 1 FROM public.shop_users WHERE email = 'emmercy65@gmail.com' AND shop_id = 'deada001-1111-4444-8888-deada0016666') THEN
        INSERT INTO public.shop_users (id, email, shop_id, role)
        VALUES (v_user_id, 'emmercy65@gmail.com', 'deada001-1111-4444-8888-deada0016666', 'shop_owner');
    END IF;

    -- Savannah Atelier
    IF NOT EXISTS (SELECT 1 FROM public.shop_users WHERE email = 'emmercy65@gmail.com' AND shop_id = '1971e852-47b4-43fa-b77b-d90642273e95') THEN
        INSERT INTO public.shop_users (id, email, shop_id, role)
        VALUES (v_user_id, 'emmercy65@gmail.com', '1971e852-47b4-43fa-b77b-d90642273e95', 'shop_owner');
    END IF;

    -- Aura & Co.
    IF NOT EXISTS (SELECT 1 FROM public.shop_users WHERE email = 'emmercy65@gmail.com' AND shop_id = '5442ce63-9c3d-45e7-bb22-35f04a698dfc') THEN
        INSERT INTO public.shop_users (id, email, shop_id, role)
        VALUES (v_user_id, 'emmercy65@gmail.com', '5442ce63-9c3d-45e7-bb22-35f04a698dfc', 'shop_owner');
    END IF;

END $$;
