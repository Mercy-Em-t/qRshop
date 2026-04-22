-- INTRODUCE SHOP SLUGS: PUBLIC IDENTITY LAYER
-- Adds 'slug' and 'slug_history' to shops for prettier public URLs.

BEGIN;

-- 1. Add columns if they don't exist
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS slug_history TEXT[] DEFAULT '{}';

-- 2. Create slug generation function
CREATE OR REPLACE FUNCTION public.generate_slug(name TEXT) RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Basic slugification: lower case, remove non-alphanumeric, replace spaces with hyphens
    base_slug := lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'));
    -- Trim leading/trailing hyphens
    base_slug := trim(both '-' from base_slug);
    
    IF base_slug = '' THEN
        base_slug := 'shop';
    END IF;

    final_slug := base_slug;
    
    -- Check for uniqueness and append counter if necessary
    WHILE EXISTS (SELECT 1 FROM public.shops WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- 3. Backfill existing shops (one-time logic)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT shop_id, name FROM public.shops WHERE slug IS NULL LOOP
        UPDATE public.shops 
        SET slug = public.generate_slug(r.name)
        WHERE shop_id = r.shop_id;
    END LOOP;
END $$;

-- 4. Add Constraints and Indexes
ALTER TABLE public.shops ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_shops_slug ON public.shops(slug);
CREATE INDEX IF NOT EXISTS idx_shops_slug_history ON public.shops USING GIN (slug_history);

COMMIT;
