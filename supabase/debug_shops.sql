-- DEBUG SHOP STATUS
SELECT shop_id, name, needs_password_change, kyc_completed, security_level 
FROM public.shops 
LIMIT 10;
