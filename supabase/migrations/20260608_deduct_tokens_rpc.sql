-- RPC to deduct tokens for platform usage
CREATE OR REPLACE FUNCTION public.deduct_tokens(p_shop_id UUID, p_amount INTEGER, p_description TEXT, p_allow_negative BOOLEAN DEFAULT false)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_shop RECORD;
    v_new_balance INTEGER;
BEGIN
    SELECT * INTO v_shop FROM public.shops WHERE id = p_shop_id;
    
    IF v_shop IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Shop not found');
    END IF;

    IF NOT p_allow_negative AND v_shop.token_balance <= 0 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Insufficient tokens. Please top up.');
    END IF;

    -- We allow tokens to go negative for leniency if p_allow_negative is true
    v_new_balance := v_shop.token_balance - p_amount;

    -- Update balance
    UPDATE public.shops 
    SET token_balance = v_new_balance
    WHERE id = p_shop_id;

    -- Log transaction
    INSERT INTO public.token_transactions (shop_id, amount, transaction_type, description)
    VALUES (p_shop_id, -p_amount, 'usage', p_description);

    RETURN jsonb_build_object('success', true, 'message', 'Tokens deducted', 'new_balance', v_new_balance);
END;
$$;
