-- MIGRATION: PRODUCT TEMPLATES & DYNAMIC SCHEMA INFRASTRUCTURE
-- Enables shops to define their own product data models with custom fields.

BEGIN;

-- 1. PRODUCT TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS public.product_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES public.shops(shop_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT DEFAULT 'Sparkles',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TEMPLATE FIELDS TABLE
CREATE TABLE IF NOT EXISTS public.product_template_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.product_templates(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    field_key TEXT NOT NULL,
    field_type TEXT NOT NULL DEFAULT 'text', -- text, number, select, checkbox, textarea
    options JSONB DEFAULT '[]'::jsonb, -- For 'select' type
    is_required BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. LINK MENU_ITEMS TO TEMPLATE
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.product_templates(id) ON DELETE SET NULL;

-- 4. ENABLE RLS
ALTER TABLE public.product_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_template_fields ENABLE ROW LEVEL SECURITY;

-- 5. POLICIES
CREATE POLICY "Public can view templates" 
ON public.product_templates FOR SELECT 
USING (true);

CREATE POLICY "Shop owners can manage their templates" 
ON public.product_templates FOR ALL 
USING (shop_id IN (
    SELECT shop_id FROM public.shop_users WHERE id = auth.uid()
));

CREATE POLICY "Public can view template fields" 
ON public.product_template_fields FOR SELECT 
USING (true);

CREATE POLICY "Shop owners can manage their template fields" 
ON public.product_template_fields FOR ALL 
USING (
    template_id IN (
        SELECT id FROM public.product_templates WHERE shop_id IN (
            SELECT shop_id FROM public.shop_users WHERE id = auth.uid()
        )
    )
);

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_product_templates_shop ON public.product_templates(shop_id);
CREATE INDEX IF NOT EXISTS idx_template_fields_template ON public.product_template_fields(template_id);

COMMIT;
