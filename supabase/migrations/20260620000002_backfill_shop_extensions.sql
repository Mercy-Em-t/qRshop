-- Backfill enabled_modules for all existing shops so they don't lose access to features
UPDATE public.shops 
SET enabled_modules = '{"ai_brain": true, "google_shopping": true, "marketing_campaigns": true, "advanced_attributes": true}'::jsonb 
WHERE enabled_modules IS NULL OR enabled_modules = '{}'::jsonb;
