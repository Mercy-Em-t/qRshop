-- 20260429000005_shop_mpesa_stk.sql
-- Enabling M-Pesa STK Push for merchants.

-- 1. Add M-Pesa configuration to shops
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS mpesa_shortcode TEXT;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS mpesa_till_number TEXT;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS mpesa_passkey TEXT;

-- 2. Add 'mpesa_stk_pending' to order status check (if any)
-- Currently orders table uses a loose TEXT for status, but good to know.

-- 3. Payments table enhancement
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS checkout_request_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS merchant_request_id TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS external_response_code TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS external_response_desc TEXT;
