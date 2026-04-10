-- AGENCY & TRUST INFRASTRUCTURE SCHEMA
-- This script establishes the Regional Agency Model and Peer-to-Peer Trust systems.

-- 1. REGIONAL AGENTS TABLE
-- Agents are the jurisdictional managers of the platform.
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    jurisdiction_name TEXT NOT NULL, -- e.g., "Nairobi West", "Savannah East"
    commission_rate NUMERIC(5,2) DEFAULT 0.00, -- Agent's cut of platform fee from their shops
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- 2. LINK SHOPS TO AGENTS
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS verification_level TEXT DEFAULT 'unverified' CHECK (verification_level IN ('unverified', 'bronze', 'silver', 'gold'));
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS trust_score NUMERIC(3,2) DEFAULT 5.00;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT 'escrow' CHECK (payment_mode IN ('escrow', 'direct'));

-- 3. TRUST & ACCOUNTABILITY: REVIEWS & REPORTS
CREATE TABLE IF NOT EXISTS public.shop_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    customer_id UUID, -- Optional: link to a persistent customer table later
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shop_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL, -- Report is routed to the jurisdictional agent
    category TEXT NOT NULL, -- e.g., "fake_product", "non_delivery", "scam"
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RLS POLICIES FOR AGENTS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_reports ENABLE ROW LEVEL SECURITY;

-- Agents can only see their own profile
CREATE POLICY "Agents can view their own profile" ON public.agents
FOR SELECT USING (auth.uid() = user_id);

-- Agents can see shops in their jurisdiction
CREATE POLICY "Agents can view their assigned shops" ON public.shops
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.agents 
        WHERE agents.user_id = auth.uid() 
        AND shops.agent_id = agents.id
    )
);

-- Agents can manage reports for their assigned shops
CREATE POLICY "Agents can manage reports for their shops" ON public.shop_reports
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.agents 
        WHERE agents.user_id = auth.uid() 
        AND shop_reports.agent_id = agents.id
    )
);

-- Public can see reviews
CREATE POLICY "Reviews are public" ON public.shop_reviews
FOR SELECT USING (true);

-- Public can see approved merchant verification
-- (Already covered by general shops policy, but adding for clarity)
CREATE POLICY "Public sees verification" ON public.shops
FOR SELECT USING (marketplace_status = 'approved');
