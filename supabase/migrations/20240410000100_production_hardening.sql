-- SAVANNAH PRODUCTION COMPLETE: CORE ARCHITECTURE & AUDIT
-- Idempotent script for full platform deployment.

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. INDUSTRY REGISTRY
CREATE TABLE IF NOT EXISTS public.industry_types (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT
);

INSERT INTO public.industry_types (slug, name) VALUES
('food', 'Food & Beverage'),
('retail', 'Retail & Stores'),
('service', 'Services'),
('digital', 'Digital Products'),
('other', 'Other')
ON CONFLICT (slug) DO NOTHING;

-- 2. AGENCY MODEL
CREATE TABLE IF NOT EXISTS public.agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    jurisdiction_name TEXT NOT NULL,
    commission_rate NUMERIC(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- 3. SHOP ENHANCEMENTS (Tiers, Payments, Industry)
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS verification_level TEXT DEFAULT 'unverified' CHECK (verification_level IN ('unverified', 'bronze', 'silver', 'gold'));
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS trust_score NUMERIC(3,2) DEFAULT 5.00;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT 'escrow' CHECK (payment_mode IN ('escrow', 'direct'));
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS industry_type TEXT DEFAULT 'retail';

-- 4. TRUST & ACCOUNTABILITY: REVIEWS & REPORTS
CREATE TABLE IF NOT EXISTS public.shop_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES public.shops(shop_id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shop_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES public.shops(shop_id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    category TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. FORENSIC AUDIT LOGS
-- Tracks critical changes (tier changes, price updates, role promotions)
CREATE TABLE IF NOT EXISTS public.system_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES auth.users(id), -- Who did it
    action TEXT NOT NULL, -- e.g., "PROMOTED_MERCHANT", "CHANGED_PAYMENT_MODE"
    target_type TEXT NOT NULL, -- e.g., "shops", "orders", "agents"
    target_id UUID,
    before_state JSONB,
    after_state JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. DINE-IN & CUSTOMER IDENTITY ENHANCEMENTS
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'delivery' CHECK (order_type IN ('delivery', 'dine_in', 'takeaway', 'instore'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS table_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email TEXT; -- CRM Foundation

-- 7. NATIVE AD NETWORK
CREATE TABLE IF NOT EXISTS public.adverts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_url TEXT NOT NULL,
    target_url TEXT,
    placement TEXT DEFAULT 'infeed' CHECK (placement IN ('header', 'infeed', 'sidebar')),
    is_active BOOLEAN DEFAULT true,
    shop_id UUID REFERENCES public.shops(shop_id) ON DELETE SET NULL, -- Optional: Brand-sponsored ads
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. PERFORMANCE INDEXING
CREATE INDEX IF NOT EXISTS idx_shops_agent ON public.shops(agent_id);
CREATE INDEX IF NOT EXISTS idx_reports_shop ON public.shop_reports(shop_id);
CREATE INDEX IF NOT EXISTS idx_audit_target ON public.system_audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_adverts_active ON public.adverts(is_active, placement);

-- 9. RLS ENABLING & POLICIES
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adverts ENABLE ROW LEVEL SECURITY;

-- 10. REGIONAL BINDING & PRIVACY
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS max_delivery_km NUMERIC DEFAULT 10;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS longitude NUMERIC;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS operational_region TEXT DEFAULT 'Nairobi';
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS mask_customer_data BOOLEAN DEFAULT true;

-- Ensure Adverts policy exists
DROP POLICY IF EXISTS "Public can view active ads" ON public.adverts;
CREATE POLICY "Public can view active ads" ON public.adverts FOR SELECT USING (is_active = true);

-- 11. CENTRALIZED LOGISTICS CONTROL
CREATE TABLE IF NOT EXISTS public.system_logistics_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region_name TEXT UNIQUE NOT NULL,
    flat_delivery_fee NUMERIC DEFAULT 150,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed some default regions
INSERT INTO public.system_logistics_config (region_name, flat_delivery_fee)
VALUES ('Nairobi', 150), ('Mombasa', 250), ('Kilimani', 100)
ON CONFLICT (region_name) DO NOTHING;

-- RLS for Logistics Config
ALTER TABLE public.system_logistics_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view delivery fees" ON public.system_logistics_config;
CREATE POLICY "Public can view delivery fees" ON public.system_logistics_config FOR SELECT USING (true);

-- Policy: Only Admins see Audit Logs
DROP POLICY IF EXISTS "Admins see all audit logs" ON public.system_audit_logs;
CREATE POLICY "Admins see all audit logs" ON public.system_audit_logs
FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.shop_users WHERE shop_users.id = auth.uid() AND role = 'system_admin')
);

-- Policy: Public can insert reports/reviews
DROP POLICY IF EXISTS "Public can submit reports" ON public.shop_reports;
CREATE POLICY "Public can submit reports" ON public.shop_reports FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public can submit reviews" ON public.shop_reviews;
CREATE POLICY "Public can submit reviews" ON public.shop_reviews FOR INSERT WITH CHECK (true);

-- 12. FORENSIC HARDENING: IMMUTABLE AUDIT LOGS
-- Ensures that nobody (even admins) can delete or alter an audit trail.
CREATE OR REPLACE FUNCTION public.prevent_audit_tampering()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Modern Savannah Forensic Rule: Audit logs are immutable and cannot be modified or deleted.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_audit_immutable ON public.system_audit_logs;
CREATE TRIGGER tr_audit_immutable
BEFORE UPDATE OR DELETE ON public.system_audit_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_tampering();

-- 13. FIX SHOP_USER CONSTRAINTS (Early repair to support multi-shop management)
DO $$ 
BEGIN
    ALTER TABLE public.shop_users DROP CONSTRAINT IF EXISTS shop_users_pkey;
    ALTER TABLE public.shop_users DROP CONSTRAINT IF EXISTS shop_users_email_key;
    ALTER TABLE public.shop_users DROP CONSTRAINT IF EXISTS shop_users_id_key;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shop_users_user_shop_unique') THEN
        ALTER TABLE public.shop_users ADD CONSTRAINT shop_users_user_shop_unique UNIQUE (id, shop_id);
    END IF;
END $$;

