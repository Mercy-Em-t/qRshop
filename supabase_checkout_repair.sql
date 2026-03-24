-- =============================================================
-- Order Data Type & Secure Checkout RPC Repair
-- =============================================================
-- This migration dynamically updates the database to support
-- string-based Table IDs (e.g. 'Patio', 'VIP', 'Takeaway') 
-- instead of strict UUIDs, and securely replaces the checkout RPC.
-- =============================================================

-- 1. Safely drop foreign key constraints targeting the old UUID structure
--    AND purge the legacy JSON function to prevent PostgREST overloading crashes!
DROP FUNCTION IF EXISTS public.checkout_cart(json);

DO $$
DECLARE constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.orders'::regclass AND confrelid = 'public.tables'::regclass;
  
  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.orders DROP CONSTRAINT ' || constraint_name;
  END IF;
END $$;

-- 2. Cast table_id natively to TEXT to accept ANY custom table string
ALTER TABLE public.orders ALTER COLUMN table_id TYPE text USING table_id::text;

-- 3. Fully overwrite the checkout_cart RPC with the 100% updated parameters and types
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
    p_table_id text := payload->>'table_id';  -- NOW TEXT
    p_discount numeric := COALESCE((payload->>'discount_amount')::numeric, 0);
    p_coupon text := payload->>'coupon_code';
    p_client_name text := payload->>'client_name';
    p_client_phone text := payload->>'client_phone';
    p_parent text := payload->>'parent_order_id';
    p_fulfillment text := COALESCE(payload->>'fulfillment_type', 'dine_in');
    p_address text := payload->>'delivery_address';
    p_fee numeric := COALESCE((payload->>'delivery_fee_charged')::numeric, 0);
    p_items jsonb := payload->'items';
BEGIN
    -- Step A: Calculate secure total directly from the raw menu_items to prevent frontend payload manipulation
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        SELECT price INTO actual_price FROM public.menu_items WHERE id = (item.value->>'id')::uuid;
        IF actual_price IS NULL THEN
            RAISE EXCEPTION 'Invalid or missing product identified payload.';
        END IF;
        calculated_total := calculated_total + (actual_price * (item.value->>'quantity')::numeric);
    END LOOP;

    -- Step B: Apply dynamic fee calculations
    calculated_total := calculated_total - p_discount + p_fee;

    -- Step C: Insert Master Order using TEXT references
    INSERT INTO public.orders (
        shop_id, table_id, total_price, status, 
        client_name, client_phone, fulfillment_type, 
        delivery_address, delivery_fee_charged, discount_amount, coupon_code, parent_order_id
    )
    VALUES (
        p_shop_id, p_table_id, calculated_total, 'pending',
        p_client_name, p_client_phone, p_fulfillment,
        p_address, p_fee, p_discount, p_coupon, NULLIF(p_parent, '')::uuid
    )
    RETURNING id INTO new_order_id;

    -- Step D: Insert Bound Order Items
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        SELECT price INTO actual_price FROM public.menu_items WHERE id = (item.value->>'id')::uuid;
        INSERT INTO public.order_items (order_id, menu_item_id, quantity, price)
        VALUES (
            new_order_id, 
            (item.value->>'id')::uuid, 
            (item.value->>'quantity')::int, 
            actual_price
        );
    END LOOP;

    RETURN new_order_id;
END;
$$;
