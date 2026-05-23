-- 20260523000004_sales_brain_ledgers.sql
-- Create transactional credit safeguards, AI usage logs, and secure RLS filters

-- 1. Upgrade decrement_ai_credits with atomic transaction checks
CREATE OR REPLACE FUNCTION public.decrement_ai_credits(sh_id uuid)
RETURNS void SECURITY DEFINER AS $$
DECLARE
  current_balance integer;
BEGIN
  -- Perform atomic update and select new value
  UPDATE public.shops
  SET ai_credits = ai_credits - 1
  WHERE shop_id = sh_id AND ai_credits > 0
  RETURNING ai_credits INTO current_balance;

  -- If no row was matched (because credits <= 0 or shop_id invalid), throw transactional exception
  IF current_balance IS NULL THEN
    RAISE EXCEPTION 'Insufficient AI Credits. Transaction aborted.';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Create Audit log table for AI credits usage history
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id uuid NOT NULL REFERENCES public.shops(shop_id) ON DELETE CASCADE,
  user_query text,
  ai_response text,
  tokens_consumed integer DEFAULT 0,
  credits_deducted integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS on audit logs
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- 4. Re-bind select rules ensuring only authorized shop owners/members can see AI logs
DROP POLICY IF EXISTS "Shop owners and members can read their own AI logs" ON public.ai_usage_logs;
CREATE POLICY "Shop owners and members can read their own AI logs"
ON public.ai_usage_logs FOR SELECT
TO authenticated
USING (
  public.check_user_is_shop_member(shop_id)
);

-- Allow serverless function / service role inserts
DROP POLICY IF EXISTS "Service role can insert AI logs" ON public.ai_usage_logs;
CREATE POLICY "Service role can insert AI logs"
ON public.ai_usage_logs FOR INSERT
TO authenticated, anon
WITH CHECK (true);
