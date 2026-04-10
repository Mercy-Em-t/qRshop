-- ===========================================
-- SECURITY UTILITIES: RATE LIMITING & AUDIT
-- ===========================================

-- 1. RATE LIMITING INFRASTRUCTURE
CREATE TABLE IF NOT EXISTS public.ratelimit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL, 
    timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.check_rate_limit(p_key TEXT, p_limit INT, p_window INTERVAL)
RETURNS boolean AS $$
DECLARE
    v_count INT;
BEGIN
    DELETE FROM public.ratelimit_logs WHERE key = p_key AND timestamp < now() - p_window;
    SELECT count(*) INTO v_count FROM public.ratelimit_logs WHERE key = p_key;
    IF v_count >= p_limit THEN
        RAISE EXCEPTION 'Rate limit exceeded for % (% requests per %)', p_key, p_limit, p_window;
    END IF;
    INSERT INTO public.ratelimit_logs (key) VALUES (p_key);
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. PAYMENT AUDIT LOG
CREATE TABLE IF NOT EXISTS payment_audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  checkout_request_id TEXT UNIQUE NOT NULL,
  target_table TEXT NOT NULL, 
  target_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'KES',
  status TEXT DEFAULT 'pending', 
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. LOGIN ATTEMPTS TRACKING
CREATE TABLE IF NOT EXISTS public.login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. RLS & POLICIES
ALTER TABLE public.ratelimit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage payment logs" ON payment_audit_log FOR ALL USING (true);
CREATE POLICY "Public can insert login attempts" ON public.login_attempts FOR INSERT WITH CHECK (true);
