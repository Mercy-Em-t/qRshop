-- 20260505000001_performance_indexes.sql
-- Add database indexes for the most frequently queried columns.
-- These prevent full table scans as data grows and significantly
-- reduce query latency for all merchants.

-- menu_items: every ProductManager/Menu page filters by shop_id
CREATE INDEX IF NOT EXISTS idx_menu_items_shop_id
  ON public.menu_items (shop_id);

-- menu_items: active items filter (used in customer menu)
CREATE INDEX IF NOT EXISTS idx_menu_items_shop_id_is_active
  ON public.menu_items (shop_id, is_active);

-- orders: every OrderManager page filters by shop_id
CREATE INDEX IF NOT EXISTS idx_orders_shop_id
  ON public.orders (shop_id);

-- orders: order status filter (common in OrderManager)
CREATE INDEX IF NOT EXISTS idx_orders_shop_id_status
  ON public.orders (shop_id, status);

-- shop_members: auth-service and all dashboard pages query by user_id
CREATE INDEX IF NOT EXISTS idx_shop_members_user_id
  ON public.shop_members (user_id);

-- shop_members: compound index for the full auth query (user + active)
CREATE INDEX IF NOT EXISTS idx_shop_members_user_id_active
  ON public.shop_members (user_id, is_active);

-- product_images: every product fetch joins on product_id
CREATE INDEX IF NOT EXISTS idx_product_images_product_id
  ON public.product_images (product_id);

-- qrs: QR dashboard filters by shop_id
CREATE INDEX IF NOT EXISTS idx_qrs_shop_id
  ON public.qrs (shop_id);

-- profiles: auth service fetches by id (this is the PK, but just in case)
-- Already indexed as PK, no action needed.

-- shops: subdomain lookups happen on every page load for custom domains
CREATE INDEX IF NOT EXISTS idx_shops_subdomain
  ON public.shops (subdomain);
