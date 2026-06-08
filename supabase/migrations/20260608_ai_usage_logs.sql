-- Migration: AI Usage Logs & Credit Decrement RPC
-- Date: 2026-06-08

-- 1. Create ai_usage_logs table
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID NOT NULL REFERENCES public.shops(shop_id) ON DELETE CASCADE,
    user_query TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    tokens_consumed INTEGER DEFAULT 0,
    credits_deducted INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add RLS policies for ai_usage_logs
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for shop owners" 
ON public.ai_usage_logs 
FOR SELECT 
USING (
  shop_id IN (
    SELECT shop_id FROM public.shop_users WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Enable insert for service role only" 
ON public.ai_usage_logs 
FOR INSERT 
WITH CHECK (true);

-- 3. Create decrement_ai_credits RPC
CREATE OR REPLACE FUNCTION public.decrement_ai_credits(sh_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.shops
  SET ai_credits = ai_credits - 1
  WHERE shop_id = sh_id AND ai_credits > 0;
END;
$$;
