-- Migration: Resilience & AI Worker Support
-- Description: Adds idempotency, fulfillment timelines, and agent tracking.

-- 1. Add new tracking columns to orders
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS client_mutation_id text UNIQUE,
ADD COLUMN IF NOT EXISTS expires_at timestamptz,
ADD COLUMN IF NOT EXISTS fulfillment_deadline timestamptz,
ADD COLUMN IF NOT EXISTS ai_agent_status text DEFAULT 'idle',
ADD COLUMN IF NOT EXISTS auto_accepted boolean DEFAULT false;

-- 2. Create communication receipts table for "Ping Back" verification
CREATE TABLE IF NOT EXISTS public.communication_receipts (
    receipt_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
    gateway_id text, -- e.g. 'whatsapp', 'system_b'
    status text DEFAULT 'sent',
    acknowledged_at timestamptz,
    payload_snapshot jsonb,
    created_at timestamptz DEFAULT now()
);

-- 3. Update checkout_cart RPC with Idempotency Support
CREATE OR REPLACE FUNCTION public.checkout_cart(payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_order_id uuid;
    item record;
    calculated_total numeric := 0;
    actual_price numeric;
    p_shop_id uuid := (payload->>'shop_id')::uuid;
    p_table_id text := payload->>'table_id';
    p_discount numeric := COALESCE((payload->>'discount_amount')::numeric, 0);
    p_coupon text := payload->>'coupon_code';
    p_client_name text := payload->>'client_name';
    p_client_phone text := payload->>'client_phone';
    p_parent text := payload->>'parent_order_id';
    p_fulfillment text := COALESCE(payload->>'fulfillment_type', 'dine_in');
    p_address text := payload->>'delivery_address';
    p_fee numeric := COALESCE((payload->>'delivery_fee_charged')::numeric, 0);
    p_email text := payload->>'customer_email';
    p_mutation_id text := payload->>'client_mutation_id'; -- Resilience key
    p_items jsonb := payload->'items';
BEGIN
    -- STEP 0: Idempotency Check
    IF p_mutation_id IS NOT NULL THEN
        SELECT id INTO new_order_id FROM public.orders WHERE client_mutation_id = p_mutation_id;
        IF new_order_id IS NOT NULL THEN
            RETURN new_order_id; -- Silently return existing order instead of erroring
        END IF;
    END IF;

    -- Step A: Secure Total Calculation
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        SELECT price INTO actual_price FROM public.menu_items WHERE id = (item.value->>'id')::uuid;
        IF actual_price IS NULL THEN
            RAISE EXCEPTION 'Invalid product in payload.';
        END IF;
        calculated_total := calculated_total + (actual_price * (item.value->>'quantity')::numeric);
    END LOOP;

    calculated_total := calculated_total - p_discount + p_fee;

    -- Step C: Insert Order with Resilience Keys
    INSERT INTO public.orders (
        shop_id, table_id, total_price, status, 
        client_name, client_phone, customer_email, fulfillment_type, 
        delivery_address, delivery_fee_charged, discount_amount, coupon_code, 
        parent_order_id, client_mutation_id,
        expires_at, fulfillment_deadline
    )
    VALUES (
        p_shop_id, p_table_id, calculated_total, 'pending',
        p_client_name, p_client_phone, p_email, p_fulfillment,
        p_address, p_fee, p_discount, p_coupon, 
        NULLIF(p_parent, '')::uuid, p_mutation_id,
        now() + interval '2 hours', -- Default expiration: 2 hours
        now() + interval '45 minutes' -- Default fulfillment target: 45 minutes
    )
    RETURNING id INTO new_order_id;

    -- Step D: Order Items
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        SELECT price INTO actual_price FROM public.menu_items WHERE id = (item.value->>'id')::uuid;
        INSERT INTO public.order_items (order_id, menu_item_id, quantity, price)
        VALUES (new_order_id, (item.value->>'id')::uuid, (item.value->>'quantity')::int, actual_price);
    END LOOP;

    RETURN new_order_id;
END;
$$;
