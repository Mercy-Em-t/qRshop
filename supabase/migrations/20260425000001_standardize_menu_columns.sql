-- MIGRATION: STANDARDIZE MENU COLUMNS
-- This migration ensures that all extended product attributes are top-level columns.
-- This resolves "column not found" errors and improves search/filtering performance.

BEGIN;

-- 1. ADD COLUMNS TO MENU_ITEMS (IF THEY DON'T EXIST)
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS benefits TEXT,
ADD COLUMN IF NOT EXISTS usage_instructions TEXT,
ADD COLUMN IF NOT EXISTS diet_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS origin TEXT,
ADD COLUMN IF NOT EXISTS processing TEXT,
ADD COLUMN IF NOT EXISTS nutrition_info TEXT,
ADD COLUMN IF NOT EXISTS recipe TEXT,
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT -1,
ADD COLUMN IF NOT EXISTS sku TEXT,
ADD COLUMN IF NOT EXISTS product_link TEXT;

-- 2. Ensure RLS allows access (usually already set, but good to be safe)
-- The existing policies on menu_items should cover these columns automatically.

-- 3. Notification to trigger a schema reload if needed
NOTIFY pgrst, 'reload schema';

COMMIT;
