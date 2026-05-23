-- Migration: Secure Order Tracking RPCs
-- Description: Replaces direct anon table reads on orders/order_items/order_ratings
--              with SECURITY DEFINER functions. The orders table SELECT policy
--              remains restricted to shop owners only. Customers access their
--              order via UUID — the UUID acts as the unguessable access token.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. get_order_for_tracking
--    Returns a safe JSON snapshot of one order. Called by TrackOrder.jsx.
--    Returns NULL (not an error) if the UUID doesn't exist.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_order_for_tracking(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id',                     o.id,
    'shop_id',                o.shop_id,
    'status',                 o.status,
    'total_price',            o.total_price,
    'discount_amount',        o.discount_amount,
    'delivery_fee_charged',   o.delivery_fee_charged,
    'mpesa_code',             o.mpesa_code,
    'created_at',             o.created_at,
    'fulfillment_type',       o.fulfillment_type,
    'fulfillment_deadline',   o.fulfillment_deadline,
    'system_b_tracking_id',   o.system_b_tracking_id,
    'customer_confirmed_at',  o.customer_confirmed_at,
    'shop_confirmed_at',      o.shop_confirmed_at,
    'edit_reason',            o.edit_reason,
    'table_number',           o.table_number,
    'shop', jsonb_build_object(
      'name',             s.name,
      'phone',            s.phone,
      'whatsapp_number',  s.whatsapp_number,
      'mpesa_till_number', s.mpesa_till_number
    ),
    'items', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id',           oi.id,
        'menu_item_id', oi.menu_item_id,
        'quantity',     oi.quantity,
        'price',        oi.price,
        'name',         mi.name
      ))
      FROM public.order_items oi
      LEFT JOIN public.menu_items mi ON mi.id = oi.menu_item_id
      WHERE oi.order_id = o.id
    ), '[]'::jsonb),
    'rating', (
      SELECT jsonb_build_object('rating', r.rating, 'comment', r.comment)
      FROM public.order_ratings r
      WHERE r.order_id = o.id
      LIMIT 1
    )
  )
  INTO v_result
  FROM public.orders o
  JOIN public.shops s ON s.id = o.shop_id
  WHERE o.id = p_order_id;

  RETURN v_result; -- NULL if not found — caller handles this gracefully
END;
$$;

-- Grant execute to anonymous (public) users
GRANT EXECUTE ON FUNCTION public.get_order_for_tracking(uuid) TO anon, authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. submit_mpesa_code
--    Customer submits their M-Pesa transaction code after manual payment.
--    Only updates the mpesa_code field — nothing else.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.submit_mpesa_code(p_order_id uuid, p_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_code IS NULL OR length(trim(p_code)) < 5 THEN
    RAISE EXCEPTION 'Invalid transaction code.';
  END IF;

  UPDATE public.orders
  SET mpesa_code = upper(trim(p_code))
  WHERE id = p_order_id
    AND status = 'pending_payment'; -- Safety: only allow code submission when shop has requested payment
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_mpesa_code(uuid, text) TO anon, authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. confirm_order_receipt
--    Customer confirms they received their order (triggers the handshake).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.confirm_order_receipt(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
  SET customer_confirmed_at = now()
  WHERE id = p_order_id
    AND status = 'ready'             -- Safety: only confirm when order is actually ready
    AND customer_confirmed_at IS NULL; -- Idempotent: ignore if already confirmed
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_order_receipt(uuid) TO anon, authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. submit_order_rating
--    Customer submits a star rating + comment. Idempotent via ON CONFLICT.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.submit_order_rating(
  p_order_id uuid,
  p_shop_id  uuid,
  p_rating   int,
  p_comment  text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5.';
  END IF;

  -- Verify the order actually belongs to this shop (prevents spoofing)
  IF NOT EXISTS (SELECT 1 FROM public.orders WHERE id = p_order_id AND shop_id = p_shop_id) THEN
    RAISE EXCEPTION 'Order not found.';
  END IF;

  INSERT INTO public.order_ratings (order_id, shop_id, rating, comment)
  VALUES (p_order_id, p_shop_id, p_rating, p_comment)
  ON CONFLICT (order_id) DO UPDATE
    SET rating = EXCLUDED.rating,
        comment = EXCLUDED.comment;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_order_rating(uuid, uuid, int, text) TO anon, authenticated;


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. cancel_order
--    Customer cancels their own order (only possible when status = 'requires_edit').
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
  SET status = 'archived'
  WHERE id = p_order_id
    AND status = 'requires_edit'; -- Safety: only allow cancel when merchant requested an edit
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_order(uuid) TO anon, authenticated;
