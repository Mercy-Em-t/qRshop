-- ==========================================
--  QR SHOP PLATFORM V3
--  Phase 7: Advanced Progressive KYC Matrix (Idempotent Migration)
-- ==========================================

-- 0. CLEAN SLATE FOR UPGRADE (Since you ran the V1 script earlier)
DROP TABLE IF EXISTS public.shop_kyc CASCADE;
DROP TYPE IF EXISTS kyc_tier CASCADE;
DROP TYPE IF EXISTS business_structure CASCADE;
DROP TYPE IF EXISTS store_deployment CASCADE;
DROP TYPE IF EXISTS business_category CASCADE;
DROP TYPE IF EXISTS price_bracket CASCADE;
DROP TYPE IF EXISTS risk_bracket CASCADE;

-- 1. Create strict Enum types for data integrity
CREATE TYPE kyc_tier AS ENUM ('tier1', 'tier2', 'tier3', 'suspended', 'rejected', 'pending');
CREATE TYPE business_structure AS ENUM ('individual', 'partnership', 'company');
CREATE TYPE store_deployment AS ENUM ('physical', 'online_only', 'mobile_vendor');
CREATE TYPE business_category AS ENUM ('food', 'retail', 'services', 'events', 'other');
CREATE TYPE price_bracket AS ENUM ('low', 'mid', 'high');
CREATE TYPE risk_bracket AS ENUM ('low', 'medium', 'high');

-- 2. Create the exhaustive KYC Table
CREATE TABLE public.shop_kyc (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE UNIQUE NOT NULL,
    
    -- Tier 3: Account Owner Identity
    owner_full_name TEXT,
    owner_phone TEXT,
    owner_email TEXT,
    owner_national_id TEXT,
    owner_dob DATE,
    id_front_url TEXT,
    id_back_url TEXT,
    passport_photo_url TEXT,
    
    -- Tier 3: Financial Settlements
    mpesa_phone TEXT,
    mpesa_account_name TEXT,
    bank_name TEXT,
    bank_account_no TEXT,
    bank_account_name TEXT,

    -- Tier 2: Business & Operations
    legal_business_name TEXT,
    business_type business_structure,
    business_reg_number TEXT,
    kra_pin TEXT,
    director_id_url TEXT,
    business_permit_url TEXT,
    kra_cert_url TEXT,
    shop_description TEXT,
    
    -- Tier 2: Location
    county_city TEXT,
    physical_address TEXT,
    google_maps_pin TEXT,
    store_type store_deployment,
    
    -- Tier 2: Operations
    category business_category,
    products_description TEXT,
    pricing_tier price_bracket,
    
    -- Risk & Compliance Checkboxes
    sells_restricted_items BOOLEAN DEFAULT false,
    accepted_terms BOOLEAN DEFAULT false,

    -- Invisible Admin / Internal Flags
    verification_status kyc_tier DEFAULT 'tier1',
    risk_level risk_bracket DEFAULT 'low',
    flag_high_volume BOOLEAN DEFAULT false,
    flag_refund_abuse BOOLEAN DEFAULT false,
    flag_suspicious BOOLEAN DEFAULT false,
    admin_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE
);

-- 3. Configure Row Level Security (RLS)
ALTER TABLE public.shop_kyc ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shop owners can read own KYC" 
ON public.shop_kyc FOR SELECT 
USING (shop_id IN (SELECT shop_id FROM public.shop_users WHERE email = auth.jwt()->>'email'));

CREATE POLICY "Shop owners can update own KYC" 
ON public.shop_kyc FOR ALL 
USING (shop_id IN (SELECT shop_id FROM public.shop_users WHERE email = auth.jwt()->>'email'));

CREATE POLICY "System Admins full access"
ON public.shop_kyc FOR ALL
USING (true) WITH CHECK (true);

-- 4. Create the Document Storage Bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('shop-documents', 'shop-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 5. Bucket Security Policies (Safely dropping if they exist first)
DROP POLICY IF EXISTS "Allow authenticated uploads to shop-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads on shop-documents" ON storage.objects;

CREATE POLICY "Allow authenticated uploads to shop-documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shop-documents');

CREATE POLICY "Allow authenticated reads on shop-documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'shop-documents');
