-- Migration: Add category_attribute_defaults to shops
-- Purpose: Stores mapping of product categories to suggested attribute keys

ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS category_attribute_defaults JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.shops.category_attribute_defaults IS 'Mapping of category names to arrays of attribute keys to suggest during product creation';
