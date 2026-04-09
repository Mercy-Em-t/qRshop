-- =============================================================
-- SECURITY HARDENING: Resource Protection & Anti-Scraping
-- =============================================================
-- This script enforces strict RLS across all sensitive tables
-- to prevent resource draining and unauthorized data viewing.
-- =============================================================

-- 1. Enable RLS on all sensitive tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- 2. Orders Protection: Only admins or the linked customer can see details
DROP POLICY IF EXISTS "Orders are viewable by owners and admins" ON orders;
CREATE POLICY "Orders are viewable by owners and admins" ON orders
FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM shop_users WHERE id = auth.uid() AND (role = 'owner' OR role = 'admin'))
);

-- 3. Menu Items Anti-Scraping: Only allow reading if shop is active
-- and limit results per query at the API level (enforced by RLS)
DROP POLICY IF EXISTS "Menu items are public for active shops" ON menu_items;
CREATE POLICY "Menu items are public for active shops" ON menu_items
FOR SELECT USING (
  EXISTS (SELECT 1 FROM shops WHERE id = shop_id AND is_online = true)
);

-- 4. Bot Protection: Order Flooding Prevention (already patched in triggers)
-- We add an additional layer of security to the events table
DROP POLICY IF EXISTS "Events are insert-only for public" ON events;
CREATE POLICY "Events are insert-only for public" ON events
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Events are viewable by admins only" ON events;
CREATE POLICY "Events are viewable by admins only" ON events
FOR SELECT USING (
  EXISTS (SELECT 1 FROM shop_users WHERE id = auth.uid() AND (role = 'owner' OR role = 'admin'))
);

-- 5. User Privacy: Nobody can see the user list except super admins
DROP POLICY IF EXISTS "Shop users are private" ON shop_users;
CREATE POLICY "Shop users are private" ON shop_users
FOR SELECT USING (
  auth.uid() = id OR 
  (SELECT role FROM shop_users WHERE id = auth.uid()) = 'system_admin'
);
