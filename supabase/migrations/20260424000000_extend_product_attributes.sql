-- MIGRATION: EXTEND PRODUCT ATTRIBUTES & SALES CONTENT INFRASTRUCTURE
-- This migration adds top-level columns for high-fidelity sales enablement and magazine generation.

BEGIN;

-- 1. ADD EXTENDED ATTRIBUTES TO MENU_ITEMS (Promoting from JSONB to columns for performance/indexing)
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS subcategory TEXT,
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS size TEXT,
ADD COLUMN IF NOT EXISTS bulk_pricing JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS benefits TEXT,
ADD COLUMN IF NOT EXISTS usage_instructions TEXT,
ADD COLUMN IF NOT EXISTS diet_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS origin TEXT,
ADD COLUMN IF NOT EXISTS processing TEXT,
ADD COLUMN IF NOT EXISTS nutrition_info TEXT,
ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS promo_info TEXT,
ADD COLUMN IF NOT EXISTS packaging TEXT,
ADD COLUMN IF NOT EXISTS delivery_info TEXT,
ADD COLUMN IF NOT EXISTS recipe TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 2. CREATE PRODUCT SALES PAGES TABLE
-- This table stores the auto-generated high-converting copy
CREATE TABLE IF NOT EXISTS public.product_sales_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.menu_items(id) ON DELETE CASCADE UNIQUE,
    headline TEXT,
    sales_script TEXT,
    benefits_summary TEXT, -- Concise bullets for UI
    recipe_suggestions TEXT,
    pdf_url TEXT,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ENABLE RLS
ALTER TABLE public.product_sales_pages ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES
CREATE POLICY "Public can view published sales pages" 
ON public.product_sales_pages FOR SELECT 
USING (is_published = true);

CREATE POLICY "Shop owners can manage their sales pages" 
ON public.product_sales_pages FOR ALL 
USING (
    product_id IN (
        SELECT id FROM public.menu_items WHERE shop_id IN (
            SELECT shop_id FROM public.shop_users WHERE id = auth.uid()
        )
    )
);

COMMIT;
