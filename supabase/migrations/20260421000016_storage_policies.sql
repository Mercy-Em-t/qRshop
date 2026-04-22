-- 20260421000016_storage_policies.sql
-- Create product-images bucket and add RLS policies

-- 1. Create Bucket (Durable check)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. DROP legacy policies if they exist (clean state)
DROP POLICY IF EXISTS "Public Select" ON storage.objects;
DROP POLICY IF EXISTS "Shop Owners Insert" ON storage.objects;
DROP POLICY IF EXISTS "Shop Owners Update" ON storage.objects;
DROP POLICY IF EXISTS "Shop Owners Delete" ON storage.objects;

-- 4. Create Policies

-- Allow public viewing of all product images
CREATE POLICY "Public Select"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow shop owners to insert images into their own folder
-- Path structure: bucket/shop_id/product_id-timestamp.ext
CREATE POLICY "Shop Owners Insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  (storage.foldername(name))[1] = (SELECT shop_id::text FROM public.shop_users WHERE id = auth.uid() LIMIT 1)
);

-- Allow shop owners to update their own images
CREATE POLICY "Shop Owners Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  (storage.foldername(name))[1] = (SELECT shop_id::text FROM public.shop_users WHERE id = auth.uid() LIMIT 1)
);

-- Allow shop owners to delete their own images
CREATE POLICY "Shop Owners Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  (storage.foldername(name))[1] = (SELECT shop_id::text FROM public.shop_users WHERE id = auth.uid() LIMIT 1)
);
