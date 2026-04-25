-- V2 Auth Layer Foundation
-- This migration establishes the clean 3-layer identity model: auth.users -> profiles -> shop_members -> shops

-- 1. Create Profiles Table (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    system_role TEXT NOT NULL DEFAULT 'user', -- 'user', 'system_admin', 'agent', 'supplier'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Shop Members Table (Many-to-Many: Users <-> Shops)
CREATE TABLE IF NOT EXISTS public.shop_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES public.shops(shop_id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'staff', -- 'owner', 'manager', 'staff', 'viewer'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    invited_by UUID REFERENCES public.profiles(id),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, shop_id)
);

-- 3. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_members ENABLE ROW LEVEL SECURITY;

-- 4. Set up RLS Policies for Profiles
-- Users can view and edit their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- System Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND system_role = 'system_admin'
        )
    );

-- 5. Set up RLS Policies for Shop Members
-- Users can view their own memberships
CREATE POLICY "Users can view own memberships" ON public.shop_members
    FOR SELECT USING (auth.uid() = user_id);

-- Shop owners can manage their shop's members
CREATE POLICY "Owners can manage shop members" ON public.shop_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.shop_members 
            WHERE user_id = auth.uid() AND shop_id = public.shop_members.shop_id AND role = 'owner'
        )
    );

-- 6. Trigger to automatically create a profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, system_role)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'user');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Add helpful comments
COMMENT ON TABLE public.profiles IS 'Unified user identity profiles linked 1:1 with auth.users';
COMMENT ON TABLE public.shop_members IS 'Many-to-many relationship mapping users to shops with specific roles';
