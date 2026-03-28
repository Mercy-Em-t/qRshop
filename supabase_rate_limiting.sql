-- RATE LIMITING INFRASTRUCTURE
-- Purpose: Prevent spamming of sensitive endpoints (orders, reports).

-- 1. Create specialized table for tracking velocity
CREATE TABLE IF NOT EXISTS public.ratelimit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL, -- e.g. 'order_from_ip_192.168...' or 'shop_id_123'
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- Delete old logs automatically (Housekeeping)
CREATE OR REPLACE FUNCTION public.prune_ratelimit_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM public.ratelimit_logs WHERE timestamp < now() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- 2. Core check function
CREATE OR REPLACE FUNCTION public.check_rate_limit(p_key TEXT, p_limit INT, p_window INTERVAL)
RETURNS boolean AS $$
DECLARE
    v_count INT;
BEGIN
    -- Prune old logs for THIS key to keep the count accurate
    DELETE FROM public.ratelimit_logs WHERE key = p_key AND timestamp < now() - p_window;

    -- Count occurrences
    SELECT count(*) INTO v_count FROM public.ratelimit_logs WHERE key = p_key;

    IF v_count >= p_limit THEN
        RAISE EXCEPTION 'Rate limit exceeded for % (% requests per %)', p_key, p_limit, p_window;
    END IF;

    -- Log the hit
    INSERT INTO public.ratelimit_logs (key) VALUES (p_key);
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger Function: Limit Orders per IP
CREATE OR REPLACE FUNCTION public.tr_limit_orders()
RETURNS TRIGGER AS $$
DECLARE
    v_client_ip TEXT;
BEGIN
    -- Attempt to get IP from HTTP headers (Supabase specific)
    v_client_ip := current_setting('request.headers', true)::json->>'x-forwarded-for';
    IF v_client_ip IS NULL THEN v_client_ip := 'unknown_client'; END IF;

    -- Limit: 5 orders per 10 minutes per IP
    PERFORM public.check_rate_limit('order_ip_' || v_client_ip, 5, INTERVAL '10 minutes');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_order_ratelimit ON public.orders;
CREATE TRIGGER tr_order_ratelimit 
BEFORE INSERT ON public.orders 
FOR EACH ROW EXECUTE FUNCTION public.tr_limit_orders();

-- 4. Enable RLS on audit logs for Admins
ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "System admins can view all audit logs" ON public.system_audit_logs;
CREATE POLICY "System admins can view all audit logs" 
ON public.system_audit_logs FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.shop_users 
        WHERE id = auth.uid() AND role = 'system_admin'
    )
);

-- 5. Login Rate Limiting
CREATE TABLE IF NOT EXISTS public.login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON public.login_attempts(ip_address);

-- RLS: Only let system admins or the system itself manage this
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "System admins can view login attempts" ON public.login_attempts;
CREATE POLICY "System admins can view login attempts" 
ON public.login_attempts FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.shop_users 
        WHERE id = auth.uid() AND role = 'system_admin'
    )
);

-- Anyone can insert a login attempt record (needed for the client-side tracking)
DROP POLICY IF EXISTS "Public can insert login attempts" ON public.login_attempts;
CREATE POLICY "Public can insert login attempts" 
ON public.login_attempts FOR INSERT 
WITH CHECK (true);

