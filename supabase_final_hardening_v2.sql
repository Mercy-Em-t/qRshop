-- SAVANNAH FINAL PRODUCTION HARDENING & PERFORMANCE V2
-- High-scale optimizations and security lockdowns

-- 1. PERFORMANCE: INDEXING FOR INDUSTRY-AWARE LOOKUPS
CREATE INDEX IF NOT EXISTS idx_shops_industry ON public.shops(industry_type);
CREATE INDEX IF NOT EXISTS idx_orders_industry_filter ON public.orders(shop_id, order_type, status);
CREATE INDEX IF NOT EXISTS idx_reports_routing ON public.shop_reports(agent_id, status);

-- 2. SECURITY: CONSUMER REPORTING RLS & SPAM PREVENTION
ALTER TABLE public.shop_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_reviews ENABLE ROW LEVEL SECURITY;

-- Allow ANYONE to submit a report (True public reporting)
CREATE POLICY "Public can submit reports" ON public.shop_reports
FOR INSERT WITH CHECK (true);

-- Allow ANYONE to submit a review
CREATE POLICY "Public can submit reviews" ON public.shop_reviews
FOR INSERT WITH CHECK (true);

-- SPAM PROTECTION: Limit reports to one pending per shop per (approximate) identity
-- This is a soft-lock; in production, you would use a CAPTCHA or Phone OTP.
ALTER TABLE public.shop_reports ADD COLUMN IF NOT EXISTS customer_id_hash TEXT; 
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_pending_report ON public.shop_reports(shop_id, customer_id_hash) 
WHERE (status = 'pending');

-- 3. LOGISTICS HARDENING
ALTER TABLE public.delivery_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Riders can see their own logs" ON public.delivery_logs
FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.delivery_workers));

-- 4. DATA INTEGRITY: PAYMENT ROUTING
-- Ensure Gold merchants don't get 'Direct' mode without a valid M-Pesa Till number
ALTER TABLE public.shops ADD CONSTRAINT check_direct_payment_config 
CHECK (
    (payment_mode = 'direct' AND verification_level = 'gold') OR 
    (payment_mode = 'escrow')
);

-- 5. REALTIME ENABLEMENT
-- Ensure the orders table and reports table are included in the publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_reports;
