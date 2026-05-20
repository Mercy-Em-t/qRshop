-- Migration: Secure Bundle Checkout
-- Description: Updates checkout_cart RPC to validate promotions server-side.
--              The discount is now RE-COMPUTED from the promotions table using
--              the applied_promotion_id — the frontend discount_amount is ignored.
--              This prevents any client-side price manipulation of bundle deals.

CREATE OR REPLACE FUNCTION public.checkout_cart(payload jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id uuid;
    item record;
    calculated_subtotal numeric := 0;
    actual_price numeric;
    server_discount numeric := 0;
    calculated_total numeric := 0;

    p_shop_id uuid := (payload->>'shop_id')::uuid;
    p_table_id text := payload->>'table_id';
    p_coupon text := payload->>'coupon_code';
    p_client_name text := payload->>'client_name';
    p_client_phone text := payload->>'client_phone';
    p_parent text := payload->>'parent_order_id';
    p_fulfillment text := COALESCE(payload->>'fulfillment_type', 'dine_in');
    p_address text := payload->>'delivery_address';
    p_fee numeric := COALESCE((payload->>'delivery_fee_charged')::numeric, 0);
    p_email text := payload->>'customer_email';
    p_mutation_id text := payload->>'client_mutation_id';
    p_items jsonb := payload->'items';
    p_promo_id uuid := NULLIF(payload->>'applied_promotion_id', '')::uuid;

    -- Promotion fields (populated server-side)
    promo record;
    promo_total_items integer := 0;
    promo_required_ids uuid[];
    has_required_items boolean := false;
BEGIN
    -- STEP 0: Idempotency — return existing order if same mutation key
    IF p_mutation_id IS NOT NULL THEN
        v_order_id := (SELECT id FROM public.orders WHERE client_mutation_id = p_mutation_id LIMIT 1);
        IF v_order_id IS NOT NULL THEN
            RETURN v_order_id;
        END IF;
    END IF;

    -- Pre-generate Order ID
    v_order_id := gen_random_uuid();

    -- STEP A: Recompute subtotal from official menu_items prices (tamper-proof)
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        actual_price := (SELECT price FROM public.menu_items WHERE id = (item.value->>'id')::uuid LIMIT 1);
        IF actual_price IS NULL THEN
            RAISE EXCEPTION 'Invalid product in payload: %', item.value->>'id';
        END IF;
        calculated_subtotal := calculated_subtotal + (actual_price * (item.value->>'quantity')::numeric);
    END LOOP;

    -- STEP B: Server-side promotion validation (replaces frontend discount_amount entirely)
    IF p_promo_id IS NOT NULL THEN
        -- Fetch the promotion from DB and verify it still belongs to this shop and is active
        SELECT * INTO promo
        FROM public.promotions
        WHERE id = p_promo_id
          AND shop_id = p_shop_id
          AND is_active = true
          AND (expires_at IS NULL OR expires_at > NOW())
        LIMIT 1;

        IF FOUND THEN
            -- Count items in cart
            promo_total_items := jsonb_array_length(p_items);

            -- Check min_items requirement
            IF promo_total_items >= COALESCE(promo.min_items, 1) THEN
                -- Check required product IDs if any are specified
                SELECT ARRAY(
                    SELECT pi.menu_item_id
                    FROM public.promotion_items pi
                    WHERE pi.promotion_id = p_promo_id
                ) INTO promo_required_ids;

                IF array_length(promo_required_ids, 1) IS NULL THEN
                    -- No specific items required → applies to entire cart
                    has_required_items := true;
                ELSE
                    -- Check that at least one required item is present in the order
                    SELECT EXISTS (
                        SELECT 1
                        FROM jsonb_array_elements(p_items) AS ci
                        WHERE (ci->>'id')::uuid = ANY(promo_required_ids)
                    ) INTO has_required_items;
                END IF;

                IF has_required_items THEN
                    -- Recompute discount based on server-side promo rules
                    IF promo.discount_type = 'percent' THEN
                        server_discount := (calculated_subtotal * COALESCE(promo.discount_value, 0)) / 100.0;
                    ELSIF promo.discount_type = 'flat' THEN
                        server_discount := LEAST(calculated_subtotal, COALESCE(promo.discount_value, 0));
                    ELSIF promo.discount_type = 'bundle_price' THEN
                        -- Bundle price: discount = subtotal - bundle_price (floor at 0)
                        server_discount := GREATEST(0, calculated_subtotal - COALESCE(promo.bundle_price, calculated_subtotal));
                    END IF;
                END IF;
            END IF;
        END IF;
        -- If promotion is not found/expired/invalid → discount stays 0, order proceeds at full price
    END IF;

    calculated_total := GREATEST(0, calculated_subtotal - server_discount + p_fee);

    -- STEP C: Insert Order with server-validated total
    INSERT INTO public.orders (
        id, shop_id, table_id, total_price, status,
        client_name, client_phone, customer_email, fulfillment_type,
        delivery_address, delivery_fee_charged, discount_amount, coupon_code,
        parent_order_id, client_mutation_id,
        expires_at, fulfillment_deadline
    )
    VALUES (
        v_order_id, p_shop_id, p_table_id, calculated_total, 'pending',
        p_client_name, p_client_phone, p_email, p_fulfillment,
        p_address, p_fee, server_discount, p_coupon,
        NULLIF(p_parent, '')::uuid, p_mutation_id,
        now() + interval '2 hours',
        now() + interval '45 minutes'
    );

    -- STEP D: Insert Order Items using server-side prices (not frontend prices)
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        actual_price := (SELECT price FROM public.menu_items WHERE id = (item.value->>'id')::uuid LIMIT 1);
        INSERT INTO public.order_items (order_id, menu_item_id, quantity, price)
        VALUES (v_order_id, (item.value->>'id')::uuid, (item.value->>'quantity')::int, actual_price);
    END LOOP;

    RETURN v_order_id;
END;
$$;
