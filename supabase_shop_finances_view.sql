-- ==========================================
-- Shop Financial Hub Views
-- ==========================================

-- 1. Daily Revenue View
CREATE OR REPLACE VIEW public.shop_daily_revenue AS
SELECT 
  shop_id,
  DATE(created_at) as sale_date,
  COUNT(id) as order_count,
  SUM(total_price) as total_revenue,
  SUM(COALESCE(discount_amount, 0)) as total_discounts
FROM public.orders
WHERE status IN ('delivered', 'paid', 'completed')
GROUP BY shop_id, DATE(created_at);

-- 2. Daily Expenses View (Wholesale purchases)
CREATE OR REPLACE VIEW public.shop_daily_expenses AS
SELECT 
  shop_id,
  DATE(created_at) as expense_date,
  COUNT(id) as wholesale_order_count,
  SUM(total_amount) as total_spent
FROM public.supplier_orders
WHERE status IN ('delivered', 'completed', 'verified')
GROUP BY shop_id, DATE(created_at);

-- Grant access to authenticated users
GRANT SELECT ON public.shop_daily_revenue TO authenticated;
GRANT SELECT ON public.shop_daily_expenses TO authenticated;
