-- ==========================================
-- Shop Communities Membership Migration
-- Run in Supabase SQL Editor
-- ==========================================

-- Join table linking shops to communities they belong to
CREATE TABLE IF NOT EXISTS shop_communities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE NOT NULL,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, community_id)
);

-- Row Level Security
ALTER TABLE shop_communities ENABLE ROW LEVEL SECURITY;

-- Anyone can see which shops are in which communities (for Discovery)
CREATE POLICY "Public can view shop community memberships"
  ON shop_communities FOR SELECT USING (true);

-- Only the shop's owner/manager can modify their memberships
CREATE POLICY "Shop users can manage their own community memberships"
  ON shop_communities FOR ALL USING (
    EXISTS (
      SELECT 1 FROM shop_users
      WHERE shop_users.shop_id = shop_communities.shop_id
        AND shop_users.id = auth.uid()
    )
  );
