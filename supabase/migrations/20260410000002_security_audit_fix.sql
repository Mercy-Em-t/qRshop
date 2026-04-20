-- =============================================================
-- SECURITY AUDIT PATCH: ROW LEVEL SECURITY FOR NEW MODULES
-- =============================================================

-- 1. CATEGORIES TABLE PROTECTION
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categories are public for active shops" ON public.categories;
CREATE POLICY "Categories are public for active shops" ON public.categories
FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.shops WHERE shops.shop_id = categories.shop_id AND shops.is_online = true)
);


DROP POLICY IF EXISTS "Owners and admins can manage categories" ON public.categories;
CREATE POLICY "Owners and admins can manage categories" ON public.categories
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.shop_users 
    WHERE id = auth.uid() AND shop_id = categories.shop_id AND (role = 'owner' OR role = 'admin')
  )
);

-- 2. ORDER NOTIFICATIONS PROTECTION (Sensitive Logs)
ALTER TABLE public.order_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners and admins can view their shop notifications" ON public.order_notifications;
CREATE POLICY "Owners and admins can view their shop notifications" ON public.order_notifications
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.shop_users 
    WHERE id = auth.uid() AND shop_id = order_notifications.shop_id AND (role = 'owner' OR role = 'admin')
  )
);

-- 3. SYSTEM AUDIT FOR RATE LIMITING
ALTER TABLE public.ratelimit_logs ENABLE ROW LEVEL SECURITY;
-- Ratelimit logs are strictly internal, no public or merchant access needed.
-- (Only system_admin if necessary, but usually just for triggers)
