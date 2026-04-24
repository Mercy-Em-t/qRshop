-- Create shop_slug_redirects table to handle legacy link permanence
CREATE TABLE IF NOT EXISTS public.shop_slug_redirects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    old_slug TEXT NOT NULL UNIQUE,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_shop_slug_redirects_old_slug ON public.shop_slug_redirects(old_slug);

-- RLS Policies
ALTER TABLE public.shop_slug_redirects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read slug redirects" 
ON public.shop_slug_redirects FOR SELECT 
USING (true);

-- Function to automatically record a redirect when a shop slug is updated
CREATE OR REPLACE FUNCTION record_slug_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.slug IS DISTINCT FROM NEW.slug) THEN
        INSERT INTO public.shop_slug_redirects (old_slug, shop_id)
        VALUES (OLD.slug, OLD.id)
        ON CONFLICT (old_slug) DO UPDATE SET shop_id = EXCLUDED.shop_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on shops table
CREATE TRIGGER trigger_record_slug_change
BEFORE UPDATE ON public.shops
FOR EACH ROW
EXECUTE FUNCTION record_slug_change();
