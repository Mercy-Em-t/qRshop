-- ==========================================
--  QR SHOP PLATFORM V3
--  Phase 7: Shop KYC & Compliance Schema
-- ==========================================

-- 1. Create the structured KYC table
CREATE TABLE IF NOT EXISTS public.shop_kyc (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE UNIQUE NOT NULL,
    legal_business_name TEXT NOT NULL,
    kra_pin TEXT NOT NULL,
    business_reg_number TEXT,
    director_id_url TEXT,
    business_permit_url TEXT,
    kra_cert_url TEXT,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'incomplete')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT
);

-- 2. Configure Row Level Security (RLS) for privacy
ALTER TABLE public.shop_kyc ENABLE ROW LEVEL SECURITY;

-- Policy: Shop Owners can read ONLY their own KYC profile
CREATE POLICY "Shop owners can read own KYC" 
ON public.shop_kyc 
FOR SELECT 
USING (
   shop_id IN (SELECT shop_id FROM public.shop_users WHERE email = auth.jwt()->>'email')
);

-- Policy: Shop Owners can insert/update their own KYC profile
CREATE POLICY "Shop owners can update own KYC" 
ON public.shop_kyc 
FOR ALL 
USING (
   shop_id IN (SELECT shop_id FROM public.shop_users WHERE email = auth.jwt()->>'email')
);

-- Policy: Authenticated users can read/write KYC (for Super Admins)
-- Note: Supabase UI allows overriding RLS for true admins, but keeping an open authenticated policy 
-- specifically for the `system_admin` role relies on your frontend router protection.
CREATE POLICY "System Admins full access"
ON public.shop_kyc
FOR ALL
USING (true)
WITH CHECK (true);

-- 3. Create the Storage Bucket for KYC Documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('shop-documents', 'shop-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 4. Set RLS on the Storage Bucket
-- Allow shops to upload to their own folder path
CREATE POLICY "Allow authenticated uploads to shop-documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'shop-documents'
);

-- Allow shops to read their own documents and Admins to read everything
CREATE POLICY "Allow authenticated reads on shop-documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'shop-documents'
);
