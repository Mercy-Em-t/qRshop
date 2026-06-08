-- Add Token Balance and Okoa Jahazi functionality to Shops table
ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS token_balance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS okoa_jahazi_limit INTEGER DEFAULT 500,
ADD COLUMN IF NOT EXISTS okoa_jahazi_active BOOLEAN DEFAULT false;

-- Create Token Transactions table
CREATE TABLE IF NOT EXISTS public.token_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('topup', 'usage', 'okoa_advance', 'okoa_fee', 'okoa_repayment', 'monthly_grant')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Token Transactions
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shops can view their own token transactions"
ON public.token_transactions
FOR SELECT
USING (shop_id = (SELECT id FROM public.shops WHERE shop_id = auth.uid()));

-- RPC to request Okoa Jahazi (Advance Tokens)
CREATE OR REPLACE FUNCTION public.request_okoa_jahazi(p_shop_id UUID, p_amount INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_shop RECORD;
    v_fee INTEGER;
    v_net_tokens INTEGER;
BEGIN
    SELECT * INTO v_shop FROM public.shops WHERE id = p_shop_id;
    
    IF v_shop IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Shop not found');
    END IF;

    IF v_shop.okoa_jahazi_active THEN
        RETURN jsonb_build_object('success', false, 'message', 'Okoa Jahazi already active. Repay existing advance first.');
    END IF;

    IF p_amount > v_shop.okoa_jahazi_limit THEN
        RETURN jsonb_build_object('success', false, 'message', 'Requested amount exceeds your Okoa Jahazi limit of ' || v_shop.okoa_jahazi_limit);
    END IF;

    -- 10% fee
    v_fee := ROUND(p_amount * 0.10);
    v_net_tokens := p_amount - v_fee;

    -- Update shop token balance (might go negative if we treat the advance as a liability, but simpler to just add tokens and mark active. Actually, we subtract the amount they OWE from future top-ups).
    -- Wait, if they have 0 tokens, and request 500 advance. They receive 450 tokens to spend. 
    -- So token_balance = 450. 
    -- But they owe 500. Next time they top up 1000, we deduct 500.
    -- Let's add an `okoa_jahazi_owed` column.
    
    RETURN jsonb_build_object('success', true, 'net_tokens', v_net_tokens, 'fee', v_fee);
END;
$$;

-- Wait, I should add `okoa_jahazi_owed` column to make it simpler.
ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS okoa_jahazi_owed INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION public.request_okoa_jahazi(p_shop_id UUID, p_amount INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_shop RECORD;
    v_fee INTEGER;
    v_net_tokens INTEGER;
BEGIN
    SELECT * INTO v_shop FROM public.shops WHERE id = p_shop_id;
    
    IF v_shop IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Shop not found');
    END IF;

    IF v_shop.okoa_jahazi_owed > 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Clear your existing Okoa Jahazi balance first.');
    END IF;

    IF p_amount > v_shop.okoa_jahazi_limit THEN
        RETURN jsonb_build_object('success', false, 'message', 'Requested amount exceeds your Okoa limit of ' || v_shop.okoa_jahazi_limit);
    END IF;

    -- 10% processing fee
    v_fee := ROUND(p_amount * 0.10);
    v_net_tokens := p_amount - v_fee;

    -- Update shop
    UPDATE public.shops 
    SET token_balance = token_balance + v_net_tokens,
        okoa_jahazi_owed = p_amount
    WHERE id = p_shop_id;

    -- Log transactions
    INSERT INTO public.token_transactions (shop_id, amount, transaction_type, description)
    VALUES (p_shop_id, v_net_tokens, 'okoa_advance', 'Okoa Jahazi Advance');
    
    INSERT INTO public.token_transactions (shop_id, amount, transaction_type, description)
    VALUES (p_shop_id, -v_fee, 'okoa_fee', 'Okoa Jahazi Processing Fee');

    RETURN jsonb_build_object('success', true, 'message', 'Okoa Jahazi credited successfully', 'net_tokens', v_net_tokens);
END;
$$;

-- RPC to process topup and auto-repay okoa jahazi
CREATE OR REPLACE FUNCTION public.topup_tokens(p_shop_id UUID, p_amount INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_shop RECORD;
    v_remaining_topup INTEGER;
    v_repayment INTEGER := 0;
BEGIN
    SELECT * INTO v_shop FROM public.shops WHERE id = p_shop_id;
    
    IF v_shop IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Shop not found');
    END IF;

    v_remaining_topup := p_amount;

    -- Auto repay Okoa
    IF v_shop.okoa_jahazi_owed > 0 THEN
        IF v_remaining_topup >= v_shop.okoa_jahazi_owed THEN
            v_repayment := v_shop.okoa_jahazi_owed;
            v_remaining_topup := v_remaining_topup - v_shop.okoa_jahazi_owed;
        ELSE
            v_repayment := v_remaining_topup;
            v_remaining_topup := 0;
        END IF;

        -- Log repayment
        INSERT INTO public.token_transactions (shop_id, amount, transaction_type, description)
        VALUES (p_shop_id, -v_repayment, 'okoa_repayment', 'Auto-repayment of Okoa Jahazi');
    END IF;

    -- Log topup (total amount)
    INSERT INTO public.token_transactions (shop_id, amount, transaction_type, description)
    VALUES (p_shop_id, p_amount, 'topup', 'Token Top-up');

    -- Update balances
    UPDATE public.shops 
    SET token_balance = token_balance + v_remaining_topup,
        okoa_jahazi_owed = okoa_jahazi_owed - v_repayment
    WHERE id = p_shop_id;

    RETURN jsonb_build_object('success', true, 'message', 'Top-up successful', 'tokens_added', v_remaining_topup, 'okoa_repaid', v_repayment);
END;
$$;
