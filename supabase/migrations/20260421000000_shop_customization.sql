-- MAMAROSY & SHOP CUSTOMIZATION: EXTENDED ATTRIBUTES AND SLUGS
-- This migration adds flexibility for shop-specific product attributes and identifies shops by slug

BEGIN;

-- 1. ADD EXTENDED ATTRIBUTES TO MENU_ITEMS
-- Using JSONB allows each shop (like Mama Rosy) to have its own 'mutation' of product attributes
-- as requested: SKU, Brand, Size, Bulk Pricing, Expiry, Benefits, Usage, etc.
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}'::jsonb;

-- 2. ENSURE SHOP SLUGS / SUBDOMAINS ARE UNIQUE AND INDEXED
-- This supports the "pointer" requirement to use shop names instead of UUIDs in URLs
CREATE UNIQUE INDEX IF NOT EXISTS idx_shops_subdomain ON public.shops(subdomain);

-- 3. SEED MAMAROSY'S EXTENDED ATTRIBUTES
-- We'll group the attributes from the user's image into the 'attributes' JSONB field
UPDATE public.menu_items
SET attributes = jsonb_build_object(
    'brand', 'Mama Rosy',
    'origin', 'Kenya',
    'processing', 'Natural/Organic',
    'delivery_info', '30-45 mins',
    'diet_tags', jsonb_build_array('Organic', 'High Fiber', 'Gluten Free'),
    'benefits', 'Direct from source, no additives',
    'usage', 'See recipe instructions',
    'nutrition', 'Rich in vitamins and minerals'
)
WHERE shop_id = 'deada001-1111-4444-8888-deada0016666'::uuid;

-- 4. UPDATE CORE CATEGORIES FOR BETTER UI FILTERING
-- (Already handled in provisioning but ensuring consistency)

COMMIT;
