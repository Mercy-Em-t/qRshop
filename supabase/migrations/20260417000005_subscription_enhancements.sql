-- Migration: Subscription Usage Tracking
-- Enhancing shops table for real-time limit monitoring and ROI tracking

-- 1. ADD COLUMNS FOR SUBSCRIPTION LIMITS & RENEWAL
ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS monthly_order_limit INT DEFAULT 100, -- Free tier default
ADD COLUMN IF NOT EXISTS monthly_orders_count INT DEFAULT 0;

-- 2. RESET MONTHLY COUNTER (Function & Trigger)
-- This ensures that on the 1st of every month, usage resets
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.shops SET monthly_orders_count = 0;
END;
$$;

-- Note: In a real production setup, this would be triggered by a Cron job (e.g., pg_cron)
-- For now, we'll implement a 'soft reset' logic in the application service as well.

-- 3. ROI TRACKING VIEW (Relationship between business and system)
-- Shows how much revenue the system has handled vs the cost (dummy/calc)
CREATE OR REPLACE VIEW public.shop_financial_relationship AS
SELECT 
    s.shop_id as shop_id,
    s.name,
    s.plan,
    s.monthly_orders_count,
    s.monthly_order_limit,
    COALESCE(SUM(o.total_price) FILTER (WHERE o.internal_status IN ('PAID', 'COMPLETED')), 0) as lifetime_revenue_handled,
    COALESCE(COUNT(o.id) FILTER (WHERE o.created_at >= date_trunc('month', now())), 0) as current_month_orders
FROM public.shops s
LEFT JOIN public.orders o ON s.shop_id = o.shop_id
GROUP BY s.shop_id;


-- 4. UPDATE ANALYTICS ENGINE TO INCREMENT USAGE
CREATE OR REPLACE FUNCTION increment_order_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.shops 
  SET monthly_orders_count = monthly_orders_count + 1
  WHERE shop_id = NEW.shop_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_increment_usage ON public.orders;
CREATE TRIGGER tr_increment_usage
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE PROCEDURE increment_order_usage();
