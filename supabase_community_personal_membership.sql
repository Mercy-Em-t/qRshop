-- ==========================================
-- Personal Community Membership
-- ==========================================

CREATE TABLE IF NOT EXISTS public.community_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member', -- member, moderator, admin
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, community_id)
);

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Memberships are viewable by everyone" 
  ON public.community_members FOR SELECT USING (true);

CREATE POLICY "Users can manage their own memberships" 
  ON public.community_members FOR ALL USING (auth.uid() = user_id);
