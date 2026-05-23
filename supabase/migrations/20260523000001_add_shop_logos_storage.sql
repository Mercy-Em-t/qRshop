-- 20260523000001_add_shop_logos_storage.sql
-- Create shop-logos bucket and set up RLS policies

-- 1. Create Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('shop-logos', 'shop-logos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop old policies if they exist
DROP POLICY IF EXISTS "Public Select Logos" ON storage.objects;
DROP POLICY IF EXISTS "Shop Owners Insert Logos" ON storage.objects;
DROP POLICY IF EXISTS "Shop Owners Update Logos" ON storage.objects;
DROP POLICY IF EXISTS "Shop Owners Delete Logos" ON storage.objects;

-- 3. Create public view policy for logos
CREATE POLICY "Public Select Logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'shop-logos');

-- 4. Create upload/management policies for shop members (V2 architecture)
CREATE POLICY "Shop Owners Insert Logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'shop-logos' AND
  (storage.foldername(name))[1] IN (
    SELECT shop_id::text FROM public.shop_members WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Shop Owners Update Logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'shop-logos' AND
  (storage.foldername(name))[1] IN (
    SELECT shop_id::text FROM public.shop_members WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Shop Owners Delete Logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'shop-logos' AND
  (storage.foldername(name))[1] IN (
    SELECT shop_id::text FROM public.shop_members WHERE user_id = auth.uid() AND is_active = true
  )
);
