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

  RETURN v_result;
END;
$$;
