-- ==========================================
-- Savannah Ecosystem: Social & Community Layer
-- ==========================================

-- 1. Community Profiles
-- Independent of shops, these are end-user profiles for the social feed
CREATE TABLE IF NOT EXISTS community_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Profiles
ALTER TABLE community_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON community_profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON community_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON community_profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Communities (Hubs / Tags / Groups)
CREATE TABLE IF NOT EXISTS communities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  banner_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Communities
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Communities are viewable by everyone." ON communities FOR SELECT USING (true);
-- Only System Admins should create communities natively to prevent spam initially
CREATE POLICY "System admins can manage communities." ON communities FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.shop_users WHERE id = auth.uid() AND role = 'system_admin'
  )
);

-- 3. Community Posts (The Social Feed)
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  author_id UUID REFERENCES community_profiles(id) ON DELETE CASCADE NOT NULL,
  community_id UUID REFERENCES communities(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  -- THE MAGIC LINK: This connects a social post to a ShopQR commerce product!
  tagged_product_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Posts
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts are viewable by everyone." ON community_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts." ON community_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can update their own posts." ON community_posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Users can delete their own posts." ON community_posts FOR DELETE USING (auth.uid() = author_id);

-- Seed some initial communities so the frontend has targets to render
INSERT INTO communities (name, slug, description) 
VALUES 
  ('Nairobi Foodies', 'nairobi-foodies', 'Discover the best street food, cafes, and fine dining.'),
  ('Savannah Crafters', 'savannah-crafters', 'A hub for hardware builders, artists, and creators.'),
  ('Tech & Hobbies', 'tech-hobbies', 'Keyboards, drones, coding, and general electronics lovers.')
ON CONFLICT (slug) DO NOTHING;
