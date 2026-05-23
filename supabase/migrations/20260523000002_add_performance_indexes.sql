-- 20260523000002_add_performance_indexes.sql
-- Add performance database indexes to improve search/membership query speed

CREATE INDEX IF NOT EXISTS idx_shop_members_user_id ON public.shop_members(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_members_shop_id ON public.shop_members(shop_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_shop_id ON public.menu_items(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON public.orders(shop_id);
