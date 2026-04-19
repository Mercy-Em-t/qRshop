-- Migration: Add Geofencing fields to Shops
-- Description: Adds latitude, longitude, and service_radius to allow for geographical bounds enforcement.

ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC,
ADD COLUMN IF NOT EXISTS service_radius INTEGER DEFAULT 10000; -- Default 10km radius

-- Optional: Indexing for future spatial queries if needed (PostGIS)
-- CREATE INDEX IF NOT EXISTS idx_shops_location ON public.shops (latitude, longitude);
