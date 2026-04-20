-- SYSTEM CONFIGURATION & MAINTENANCE INFRASTRUCTURE
-- This migration provides the foundation for feature toggles and global maintenance mode.

BEGIN;

-- 1. Create System Config Table
CREATE TABLE IF NOT EXISTS public.system_config (
    config_key TEXT PRIMARY KEY,
    config_value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- 2. Enable RLS
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- 3. Initial Configuration
INSERT INTO public.system_config (config_key, config_value, description)
VALUES 
('maintenance_mode', '{"is_active": false, "message": "System optimization in progress. We will be back shortly.", "allow_admins": true}', 'Global maintenance toggle'),
('feature_flags', '{"bulk_upload": true, "ai_agent": true, "manual_payments": true}', 'Granular feature control'),
('platform_version', '{"build": "2026.04.20", "required": false}', 'Version tracking')
ON CONFLICT (config_key) DO NOTHING;

-- 4. Policies
-- Public/Authenticated can READ config
DROP POLICY IF EXISTS "Anyone can read system config" ON public.system_config;
CREATE POLICY "Anyone can read system config" ON public.system_config FOR SELECT USING (true);

-- Only System Admins can UPDATE config
DROP POLICY IF EXISTS "Admins can manage system config" ON public.system_config;
CREATE POLICY "Admins can manage system config" ON public.system_config 
FOR ALL 
TO authenticated 
USING (
    EXISTS (SELECT 1 FROM public.shop_users WHERE id = auth.uid() AND role = 'system_admin')
);

COMMIT;
