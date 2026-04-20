-- VERIFY WHITNEY ACCESS
SELECT email, shop_id, role 
FROM public.shop_users 
WHERE email ILIKE '%whitney%';
