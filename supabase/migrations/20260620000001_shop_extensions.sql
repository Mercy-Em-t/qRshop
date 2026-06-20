-- Add enabled_modules column to shops to track which optional features are enabled
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS enabled_modules JSONB DEFAULT '{}'::jsonb;
