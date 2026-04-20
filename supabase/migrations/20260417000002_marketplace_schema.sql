-- Migration: Marketplace Onboarding & Network Connectivity
-- Empowers shops to join the global Marketplace and configure logistics

ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS is_marketplace_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS marketplace_terms_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS marketplace_commission_rate DECIMAL(5,2) DEFAULT 0.05, -- 5% default marketplace fee
ADD COLUMN IF NOT EXISTS logistics_provider TEXT DEFAULT 'self', -- options: self, marketplace_standard, partner_express
ADD COLUMN IF NOT EXISTS distributor_network_active BOOLEAN DEFAULT false;

-- Terms of Service Reference (Meta-data)
CREATE TABLE IF NOT EXISTS public.marketplace_terms (
    id SERIAL PRIMARY KEY,
    version_label TEXT NOT NULL,
    terms_content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    effective_date DATE DEFAULT CURRENT_DATE
);

INSERT INTO public.marketplace_terms (version_label, terms_content)
VALUES ('v1.0-2026', 'By joining the qRshop Marketplace, you agree to: 
1. Maintain accurate stock and pricing.
2. Fulfill marketplace orders within 30 minutes of acceptance.
3. Pay a 5% commission on all orders routed through the central directory.
4. Adhere to the Ethical Merchant Guidelines for MSMEs.')
ON CONFLICT DO NOTHING;
