-- FULL TEXT SEARCH (FTS) OPTIMIZATION
-- Implements high-performance search for products/menu items

-- 1. Add the tsvector column
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS fts_vector tsvector;

-- 2. Create the GIN Index for fast lookups
CREATE INDEX IF NOT EXISTS menu_items_fts_idx ON public.menu_items USING GIN (fts_vector);

-- 3. Function to update the fts_vector based on name and description
CREATE OR REPLACE FUNCTION menu_items_fts_trigger() RETURNS trigger AS $$
BEGIN
  new.fts_vector :=
    setweight(to_tsvector('english', coalesce(new.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B');
  RETURN new;
END
$$ LANGUAGE plpgsql;

-- 4. Create the trigger
DROP TRIGGER IF EXISTS trg_menu_items_fts ON public.menu_items;
CREATE TRIGGER trg_menu_items_fts
BEFORE INSERT OR UPDATE ON public.menu_items
FOR EACH ROW EXECUTE FUNCTION menu_items_fts_trigger();

-- 5. Backfill existing data
UPDATE public.menu_items SET fts_vector = 
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B')
WHERE fts_vector IS NULL;
