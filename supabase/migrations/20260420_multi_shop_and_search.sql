-- UPGRADE: MULTI-SHOP ACCESS & SEARCH OPTIMIZATION
-- Supporting master accounts managing multiple shops and high-speed lookups.

-- 1. MODIFY shop_users to support many-to-many
-- First, identify if there's a primary key constraint to drop.
-- In most cases it's just 'shop_users_pkey'. 
DO $$ 
BEGIN
    ALTER TABLE public.shop_users DROP CONSTRAINT IF EXISTS shop_users_pkey;
END $$;

-- Add composite primary key
ALTER TABLE public.shop_users ADD PRIMARY KEY (id, shop_id);

-- 2. SEARCH OPTIMIZATION
-- Add searchable vector column to menu_items (if not already present)
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION menu_items_search_trigger() RETURNS trigger AS $$
BEGIN
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.category, '')), 'C') ||
    setweight(to_tsvector('english', array_to_string(coalesce(new.tags, '{}'), ' ')), 'B');
  return new;
END
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS tr_menu_items_search ON public.menu_items;
CREATE TRIGGER tr_menu_items_search BEFORE INSERT OR UPDATE
ON public.menu_items FOR EACH ROW EXECUTE FUNCTION menu_items_search_trigger();

-- Initialize existing rows
UPDATE public.menu_items SET search_vector = 
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'C') ||
    setweight(to_tsvector('english', array_to_string(coalesce(tags, '{}'), ' ')), 'B');

-- Add GIN index for fast search
CREATE INDEX IF NOT EXISTS idx_menu_items_search_gin ON public.menu_items USING GIN (search_vector);
