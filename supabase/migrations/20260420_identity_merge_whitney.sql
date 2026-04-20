-- Identity Merge & Cleanup for Whitney
-- Objective: Delete amoitwhitney21@gmail.com (duplicate/messed up)
-- Rename amoitwhitney211@gmail.com to amoitwhitney21@gmail.com
-- Consolidate all shop_owner associations

DO $$
DECLARE
    v_old_email TEXT := 'amoitwhitney21@gmail.com';
    v_new_email_temp TEXT := 'amoitwhitney211@gmail.com';
    v_correct_email TEXT := 'amoitwhitney21@gmail.com';
BEGIN
    -- 1. Transfer any unique shop links from 'old' to 'new' account
    -- (The schema fix will allow (email, shop_id) pairs)
    UPDATE public.shop_users
    SET email = v_new_email_temp
    WHERE email = v_old_email
    AND shop_id NOT IN (SELECT shop_id FROM public.shop_users WHERE email = v_new_email_temp);

    -- 2. Consolidate: If both accounts had the same shop, delete the 'old' one
    DELETE FROM public.shop_users WHERE email = v_old_email;

    -- 3. Delete the 'old' account from auth.users (messed up identity)
    DELETE FROM auth.users WHERE email = v_old_email;

    -- 4. Identity Cutover: Rename the 'temp' email to 'correct' email everywhere
    UPDATE auth.users SET email = v_correct_email WHERE email = v_new_email_temp;
    UPDATE public.shop_users SET email = v_correct_email WHERE email = v_new_email_temp;
    
    -- Fix auth.identities
    UPDATE auth.identities 
    SET identity_data = identity_data || format('{"email": "%s"}', v_correct_email)::jsonb
    WHERE identity_data->>'email' = v_new_email_temp;

END $$;
