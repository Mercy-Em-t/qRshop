-- ==========================================
-- Promo Bundles & Marketing Studio Schema
-- ==========================================

-- 1. Promotions table (Bundle/Discount definitions)
CREATE TABLE IF NOT EXISTS promotions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,           -- e.g., "Weekend Combo", "Lunch Special"
  description TEXT,
  discount_type TEXT DEFAULT 'percent', -- 'percent' | 'flat' | 'bundle_price'
  discount_value NUMERIC DEFAULT 0,     -- 10 for 10%, 500 for KSh 500
  bundle_price NUMERIC,                 -- Specific total price if type is 'bundle_price'
  coupon_code TEXT,                     -- Optional code to trigger this
  min_items INT DEFAULT 1,              -- Min items required in cart to apply
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for coupon code searches per shop
CREATE UNIQUE INDEX IF NOT EXISTS idx_promotions_code_shop ON promotions(coupon_code, shop_id);

-- 2. Promotion Items (Join table for products included in this promo)
CREATE TABLE IF NOT EXISTS promotion_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE NOT NULL,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(promotion_id, menu_item_id)
);

-- 3. Row Level Security
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_items ENABLE ROW LEVEL SECURITY;

-- Anonymous users can read active promotions (to see "Deals" in marketplace/cart)
CREATE POLICY "Public can view active promotions"
  ON promotions FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Public can view promotion items"
  ON promotion_items FOR SELECT USING (true);

-- Shop owners can manage their own promotions
CREATE POLICY "Shop users can manage their promotions"
  ON promotions FOR ALL USING (
    EXISTS (
      SELECT 1 FROM shop_users
      WHERE shop_users.shop_id = promotions.shop_id
        AND shop_users.id = auth.uid()
    )
  );

CREATE POLICY "Shop users can manage their promotion items"
  ON promotion_items FOR ALL USING (
    EXISTS (
      SELECT 1 FROM promotions
      JOIN shop_users ON shop_users.shop_id = promotions.shop_id
      WHERE promotions.id = promotion_items.promotion_id
        AND shop_users.id = auth.uid()
    )
  );
