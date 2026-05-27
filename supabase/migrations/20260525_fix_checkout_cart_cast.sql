-- Fix for order_type enum casting error in checkout_cart
-- 1. Add missing routing types to the enum if they don't exist
ALTER TYPE order_routing_type ADD VALUE IF NOT EXISTS 'direct';
ALTER TYPE order_routing_type ADD VALUE IF NOT EXISTS 'whatsapp';
ALTER TYPE order_routing_type ADD VALUE IF NOT EXISTS 'pos';
ALTER TYPE order_routing_type ADD VALUE IF NOT EXISTS 'mpesa';

-- 2. Update checkout_cart to properly cast the text payload into the enum type
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
    p_order_type text := COALESCE(payload->>'order_type', 'direct');
    p_items jsonb := payload->'items';
    p_promo_id uuid := NULLIF(payload->>'applied_promotion_id', '')::uuid;

    promo record;
    promo_total_items integer := 0;
    promo_required_ids uuid[];
    has_required_items boolean := false;

BEGIN
    IF p_mutation_id IS NOT NULL THEN
        v_order_id := (SELECT id FROM public.orders WHERE client_mutation_id = p_mutation_id LIMIT 1);
        IF v_order_id IS NOT NULL THEN
            RETURN v_order_id;
        END IF;
    END IF;

    v_order_id := gen_random_uuid();

    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        actual_price := (SELECT price FROM public.menu_items WHERE id = (item.value->>'id')::uuid LIMIT 1);
        IF actual_price IS NULL THEN
            RAISE EXCEPTION 'Invalid product in payload: %', item.value->>'id';
        END IF;
        calculated_subtotal := calculated_subtotal + (actual_price * (item.value->>'quantity')::numeric);
    END LOOP;

    IF p_promo_id IS NOT NULL THEN
        SELECT * INTO promo
        FROM public.promotions
        WHERE id = p_promo_id
          AND shop_id = p_shop_id
          AND is_active = true
          AND (expires_at IS NULL OR expires_at > NOW())
        LIMIT 1;

        IF FOUND THEN
            promo_total_items := jsonb_array_length(p_items);
            IF promo_total_items >= COALESCE(promo.min_items, 1) THEN
                SELECT ARRAY(
                    SELECT pi.menu_item_id
                    FROM public.promotion_items pi
                    WHERE pi.promotion_id = p_promo_id
                ) INTO promo_required_ids;

                IF array_length(promo_required_ids, 1) IS NULL THEN
                    has_required_items := true;
                ELSE
                    SELECT EXISTS (
                        SELECT 1
                        FROM jsonb_array_elements(p_items) AS ci
                        WHERE (ci->>'id')::uuid = ANY(promo_required_ids)
                    ) INTO has_required_items;
                END IF;

                IF has_required_items THEN
                    IF promo.discount_type = 'percent' THEN
                        server_discount := (calculated_subtotal * COALESCE(promo.discount_value, 0)) / 100.0;
                    ELSIF promo.discount_type = 'flat' THEN
                        server_discount := LEAST(calculated_subtotal, COALESCE(promo.discount_value, 0));
                    ELSIF promo.discount_type = 'bundle_price' THEN
                        server_discount := GREATEST(0, calculated_subtotal - COALESCE(promo.bundle_price, calculated_subtotal));
                    END IF;
                END IF;
            END IF;
        END IF;
    END IF;

    calculated_total := GREATEST(0, calculated_subtotal - server_discount + p_fee);

    INSERT INTO public.orders (
        id, shop_id, table_id, total_price, status,
        client_name, client_phone, customer_email, fulfillment_type,
        delivery_address, delivery_fee_charged, discount_amount, coupon_code,
        parent_order_id, client_mutation_id,
        expires_at, fulfillment_deadline,
        order_type
    )
    VALUES (
        v_order_id, p_shop_id, p_table_id, calculated_total, 'pending',
        p_client_name, p_client_phone, p_email, p_fulfillment,
        p_address, p_fee, server_discount, p_coupon,
        NULLIF(p_parent, '')::uuid, p_mutation_id,
        now() + interval '2 hours',
        now() + interval '45 minutes',
        p_order_type::order_routing_type  -- <-- THE FIX IS HERE
    );

    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        actual_price := (SELECT price FROM public.menu_items WHERE id = (item.value->>'id')::uuid LIMIT 1);
        INSERT INTO public.order_items (order_id, menu_item_id, quantity, price)
        VALUES (v_order_id, (item.value->>'id')::uuid, (item.value->>'quantity')::int, actual_price);
    END LOOP;

    RETURN v_order_id;
END;
$$;
