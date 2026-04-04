-- ==========================================
-- Strategic Security Patch: Injection & Burst Mitigation
-- ==========================================

-- 1. Add Rate Tracking to Admin Users
ALTER TABLE public.shop_users 
ADD COLUMN IF NOT EXISTS last_api_call_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Anti-Spam Trigger for Orders (Public Endpoint Protection)
-- This prevents a bot from flooding the system with fake orders.
-- Limit: 5 orders per 5 minutes per Device ID.
CREATE OR REPLACE FUNCTION block_order_spam()
RETURNS TRIGGER AS $$
DECLARE
    recent_count INT;
BEGIN
    SELECT COUNT(*) INTO recent_count 
    FROM orders 
    WHERE device_id = NEW.device_id 
      AND created_at > NOW() - INTERVAL '5 minutes';

    IF recent_count >= 5 THEN
        RAISE EXCEPTION 'ORDER_RATE_LIMIT_REACHED: You are sending orders too quickly. Please wait 5 minutes before trying again.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_order_spam ON orders;
CREATE TRIGGER check_order_spam
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION block_order_spam();

-- 3. Enhance RLS for Industry Types (Prevent Injection in Metadata)
-- Only allow system_admin to manage taxonomies.
ALTER TABLE public.industry_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage industry types" ON public.industry_types;
CREATE POLICY "Admins manage industry types"
ON public.industry_types
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.shop_users
    WHERE public.shop_users.id = auth.uid()
      AND public.shop_users.role = 'system_admin'
  )
);
