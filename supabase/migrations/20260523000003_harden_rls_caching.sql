-- 20260523000003_harden_rls_caching.sql
-- Create cached RLS security functions and bind optimized policies to storage

-- 1. Create transaction-cached security definer lookup function
CREATE OR REPLACE FUNCTION public.check_user_is_shop_member(target_shop_id uuid)
RETURNS boolean SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.shop_members 
    WHERE user_id = auth.uid() AND shop_id = target_shop_id AND is_active = true
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Drop old policies to re-bind cleanly
DROP POLICY IF EXISTS "Shop Owners Insert" ON storage.objects;
DROP POLICY IF EXISTS "Shop Owners Update" ON storage.objects;
DROP POLICY IF EXISTS "Shop Owners Delete" ON storage.objects;

DROP POLICY IF EXISTS "Shop Owners Insert Logos" ON storage.objects;
DROP POLICY IF EXISTS "Shop Owners Update Logos" ON storage.objects;
DROP POLICY IF EXISTS "Shop Owners Delete Logos" ON storage.objects;

-- 3. Create optimized storage policies utilizing check_user_is_shop_member

-- Product Images Policies
CREATE POLICY "Shop Owners Insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  public.check_user_is_shop_member((storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Shop Owners Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  public.check_user_is_shop_member((storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Shop Owners Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  public.check_user_is_shop_member((storage.foldername(name))[1]::uuid)
);

-- Shop Logos Policies
CREATE POLICY "Shop Owners Insert Logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'shop-logos' AND
  public.check_user_is_shop_member((storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Shop Owners Update Logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'shop-logos' AND
  public.check_user_is_shop_member((storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Shop Owners Delete Logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'shop-logos' AND
  public.check_user_is_shop_member((storage.foldername(name))[1]::uuid)
);
