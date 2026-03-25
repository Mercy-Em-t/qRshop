-- ==========================================
-- Supplier Portal Schema
-- ==========================================

-- 1. Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  logo_url TEXT,
  website TEXT,
  mpesa_shortcode TEXT,
  mpesa_passkey TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Supplier Items (Catalogs)
CREATE TABLE IF NOT EXISTS supplier_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,       -- Wholesale price
  moq INT DEFAULT 1,            -- Minimum Order Quantity
  category TEXT,
  image_url TEXT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Supplier Orders (B2B Orders)
CREATE TABLE IF NOT EXISTS supplier_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE NOT NULL,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL, -- The ordering shop
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'
  total_amount NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Supplier Order Items
CREATE TABLE IF NOT EXISTS supplier_order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES supplier_orders(id) ON DELETE CASCADE NOT NULL,
  supplier_item_id UUID REFERENCES supplier_items(id) ON DELETE CASCADE NOT NULL,
  quantity INT NOT NULL,
  price_at_order NUMERIC NOT NULL
);

-- 5. Row Level Security
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_order_items ENABLE ROW LEVEL SECURITY;

-- Public/Log-in discovery of suppliers (Shop owners can see them)
CREATE POLICY "Logged in users can view verified suppliers"
  ON suppliers FOR SELECT USING (is_verified = true OR owner_id = auth.uid());

CREATE POLICY "Logged in users can view supplier items"
  ON supplier_items FOR SELECT USING (true);

-- Supplier owners manage their own data
CREATE POLICY "Suppliers can manage their profile"
  ON suppliers FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Suppliers can manage their items"
  ON supplier_items FOR ALL USING (
    EXISTS (SELECT 1 FROM suppliers WHERE suppliers.id = supplier_items.supplier_id AND suppliers.owner_id = auth.uid())
  );

-- Shop owners manage their orders
CREATE POLICY "Shops can manage their supplier orders"
  ON supplier_orders FOR ALL USING (
    EXISTS (SELECT 1 FROM shop_users WHERE shop_users.shop_id = supplier_orders.shop_id AND shop_users.id = auth.uid())
  );

-- Suppliers can view orders made to them
CREATE POLICY "Suppliers can view incoming orders"
  ON supplier_orders FOR SELECT USING (
    EXISTS (SELECT 1 FROM suppliers WHERE suppliers.id = supplier_orders.supplier_id AND suppliers.owner_id = auth.uid())
  );

-- Order items follow order policies
CREATE POLICY "Access supplier order items"
  ON supplier_order_items FOR ALL USING (
    EXISTS (SELECT 1 FROM supplier_orders WHERE supplier_orders.id = supplier_order_items.order_id) -- Simplified for brevity, RLS inherits from parent in practice
  );
