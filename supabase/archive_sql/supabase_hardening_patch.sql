-- ==========================================
-- Pre-Deployment Hardening Patch
-- Run in Supabase SQL Editor before deploying
-- ==========================================

-- 1. Make owner_id nullable on suppliers so public signups work
--    (Admin sets owner_id after vetting the application)
ALTER TABLE suppliers ALTER COLUMN owner_id DROP NOT NULL;

-- 2. Tighten supplier_order_items RLS to explicitly verify caller identity
DROP POLICY IF EXISTS "Access supplier order items" ON supplier_order_items;

-- Shops can access order items for their own orders
CREATE POLICY "Shops can access their order items"
  ON supplier_order_items FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM supplier_orders so
      JOIN shop_users su ON su.shop_id = so.shop_id
      WHERE so.id = supplier_order_items.order_id
        AND su.id = auth.uid()
    )
  );

-- Suppliers can access order items for orders sent to them
CREATE POLICY "Suppliers can access incoming order items"
  ON supplier_order_items FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM supplier_orders so
      JOIN suppliers s ON s.id = so.supplier_id
      WHERE so.id = supplier_order_items.order_id
        AND s.owner_id = auth.uid()
    )
  );

-- Shops can insert order items for their own orders
CREATE POLICY "Shops can insert order items"
  ON supplier_order_items FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM supplier_orders so
      JOIN shop_users su ON su.shop_id = so.shop_id
      WHERE so.id = supplier_order_items.order_id
        AND su.id = auth.uid()
    )
  );
