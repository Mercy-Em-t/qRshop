-- DIAGNOSE MAMA ROSY FLAG
SELECT shop_id, name, needs_password_change, kyc_completed 
FROM public.shops 
WHERE shop_id = 'deada001-1111-4444-8888-deada0016666';
