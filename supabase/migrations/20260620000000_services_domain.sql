-- 20260620000000_services_domain.sql

-- 1. Create services table
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(shop_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2),
    linked_product_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_services_shop_id ON public.services(shop_id);
CREATE INDEX IF NOT EXISTS idx_services_shop_id_active ON public.services(shop_id, is_active);

-- 2. Create service_leads table
CREATE TABLE IF NOT EXISTS public.service_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(shop_id) ON DELETE CASCADE,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_contact TEXT NOT NULL,
    customer_needs TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_service_leads_shop_id ON public.service_leads(shop_id);
CREATE INDEX IF NOT EXISTS idx_service_leads_status ON public.service_leads(status);

-- 3. Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_leads ENABLE ROW LEVEL SECURITY;

-- 4. Services Policies

-- Public can view active services
CREATE POLICY "Public can view active services" 
    ON public.services FOR SELECT 
    TO anon, authenticated
    USING (is_active = true);

-- Merchant Select
CREATE POLICY "Merchant Select Services"
    ON public.services FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.shop_members
            WHERE shop_members.shop_id = public.services.shop_id
            AND shop_members.user_id = auth.uid()
            AND shop_members.is_active = true
        )
    );

-- Merchant Insert
CREATE POLICY "Merchant Insert Services"
    ON public.services FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.shop_members
            WHERE shop_members.shop_id = public.services.shop_id
            AND shop_members.user_id = auth.uid()
            AND shop_members.is_active = true
        )
    );

-- Merchant Update
CREATE POLICY "Merchant Update Services"
    ON public.services FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.shop_members
            WHERE shop_members.shop_id = public.services.shop_id
            AND shop_members.user_id = auth.uid()
            AND shop_members.is_active = true
        )
    );

-- Merchant Delete
CREATE POLICY "Merchant Delete Services"
    ON public.services FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.shop_members
            WHERE shop_members.shop_id = public.services.shop_id
            AND shop_members.user_id = auth.uid()
            AND shop_members.is_active = true
        )
    );

-- 5. Service Leads Policies

-- Public can insert leads
CREATE POLICY "Public can insert service leads" 
    ON public.service_leads FOR INSERT 
    TO anon, authenticated
    WITH CHECK (true);

-- Merchant Select
CREATE POLICY "Merchant Select Service Leads"
    ON public.service_leads FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.shop_members
            WHERE shop_members.shop_id = public.service_leads.shop_id
            AND shop_members.user_id = auth.uid()
            AND shop_members.is_active = true
        )
    );

-- Merchant Update
CREATE POLICY "Merchant Update Service Leads"
    ON public.service_leads FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.shop_members
            WHERE shop_members.shop_id = public.service_leads.shop_id
            AND shop_members.user_id = auth.uid()
            AND shop_members.is_active = true
        )
    );

-- Merchant Delete
CREATE POLICY "Merchant Delete Service Leads"
    ON public.service_leads FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.shop_members
            WHERE shop_members.shop_id = public.service_leads.shop_id
            AND shop_members.user_id = auth.uid()
            AND shop_members.is_active = true
        )
    );
