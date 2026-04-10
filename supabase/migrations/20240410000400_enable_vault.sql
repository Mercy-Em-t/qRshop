-- ===========================================
-- SECRETS GOVERNANCE: SECURE TABLE FALLBACK
-- (Used when 'vault' extension is unavailable)
-- ===========================================

-- 1. Create a private schema for security assets
CREATE SCHEMA IF NOT EXISTS "internal_security";

-- 2. Create the Secrets Table
CREATE TABLE IF NOT EXISTS "internal_security"."platform_secrets" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" text UNIQUE NOT NULL,
    "secret" text NOT NULL,
    "description" text,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now()
);

-- 3. Enable Row-Level Security
ALTER TABLE "internal_security"."platform_secrets" ENABLE ROW LEVEL SECURITY;

-- 4. Create Strict RLS Policies
-- Only the service_role (Edge Functions/Admins) can ever see these secrets
CREATE POLICY "Service Role Full Access" 
ON "internal_security"."platform_secrets"
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- 5. Enable pg_net for Edge Function communication
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- 6. Create the Compatibility RPC for Edge Functions
-- This matches the interface used in Phase 5 Edge Functions
CREATE OR REPLACE FUNCTION public.get_decrypted_secrets()
RETURNS TABLE (name text, decrypted_secret text)
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with owner privileges
SET search_path = internal_security, public
AS $$
BEGIN
  -- Security Guard: Only allow service_role or system_admins to call this
  -- This prevents malicious authenticated users from dumping the vault
  IF NOT (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM public.shop_users WHERE id = auth.uid() AND role = 'system_admin')) THEN
    RAISE EXCEPTION 'Unauthorized access to platform secrets.';
  END IF;

  RETURN QUERY SELECT s.name, s.secret FROM internal_security.platform_secrets s;
END;
$$;

-- 7. Add Metadata/Usage Comments
COMMENT ON TABLE internal_security.platform_secrets IS 'Secure storage for platform-level API keys. Accessible only via service_role or get_decrypted_secrets() RPC.';
