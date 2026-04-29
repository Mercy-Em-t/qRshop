-- 20260429000002_fix_storage_rls_v2.sql
-- Update storage policies to work with V2 shop_members architecture

-- 1. DROP old policies that reference legacy shop_users
DROP POLICY IF EXISTS "Shop Owners Insert" ON storage.objects;
DROP POLICY IF EXISTS "Shop Owners Update" ON storage.objects;
DROP POLICY IF EXISTS "Shop Owners Delete" ON storage.objects;

-- 2. Create V2 compatible policies
-- Structure: bucket/shop_id/file.ext
-- Policy checks if the first folder segment (shop_id) belongs to a shop where the user is a member.

CREATE POLICY "Shop Owners Insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  (storage.foldername(name))[1] IN (
    SELECT shop_id::text FROM public.shop_members WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Shop Owners Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  (storage.foldername(name))[1] IN (
    SELECT shop_id::text FROM public.shop_members WHERE user_id = auth.uid() AND is_active = true
  )
);

CREATE POLICY "Shop Owners Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  (storage.foldername(name))[1] IN (
    SELECT shop_id::text FROM public.shop_members WHERE user_id = auth.uid() AND is_active = true
  )
);
