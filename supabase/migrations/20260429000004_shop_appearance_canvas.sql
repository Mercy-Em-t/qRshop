-- 20260429000004_shop_appearance_canvas.sql
-- Implementing 'Savannah Canvas': A modular, plugin-based layout system for public webshops.

-- 1. Add appearance_config to shops
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS appearance_config JSONB DEFAULT '{
  "layout": ["hero", "categories", "featured_grid", "value_props", "cta"],
  "theme": {
    "primary_color": "#6366f1",
    "secondary_color": "#10b981",
    "font_family": "Outfit",
    "border_radius": "xl",
    "show_background_pattern": true
  },
  "sections": {
    "hero": { "type": "classic", "show_tagline": true },
    "featured_grid": { "title": "Featured Collections", "limit": 4 },
    "cta": { "text": "View Full Menu", "bg": "primary" }
  }
}'::jsonb;

-- 2. Add custom_css column for power users
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS custom_css TEXT;

-- 3. Update existing shops with a default healthy config if they are null
UPDATE public.shops SET appearance_config = '{
  "layout": ["hero", "categories", "featured_grid", "value_props", "cta"],
  "theme": {
    "primary_color": "#6366f1",
    "secondary_color": "#10b981",
    "font_family": "Outfit",
    "border_radius": "xl",
    "show_background_pattern": true
  }
}'::jsonb WHERE appearance_config IS NULL;
