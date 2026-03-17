import { supabase } from "./supabase-client";

/**
 * Create an order record in the database before sending via WhatsApp.
 * This prevents spam and enables analytics tracking.
 */
export async function createOrder(shopId, tableId, items, totalPrice, discountAmount = 0, couponCode = null, clientName = null, clientPhone = null, parentOrderId = null) {
  if (!supabase) {
    // Return a mock order when Supabase is not configured
    return {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      shop_id: shopId,
      table_id: tableId,
      total_price: totalPrice,
      discount_amount: discountAmount,
      coupon_code: couponCode,
      client_name: clientName,
      client_phone: clientPhone,
      parent_order_id: parentOrderId,
      status: "pending",
      created_at: new Date().toISOString(),
    };
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      shop_id: shopId,
      table_id: tableId, // make sure to include this
      total_price: totalPrice,
      discount_amount: discountAmount,
      coupon_code: couponCode,
      client_name: clientName,
      client_phone: clientPhone,
      parent_order_id: parentOrderId,
      status: "pending_payment",
    })
    .select()
    .single();

  if (orderError) {
    console.error("Error creating order:", orderError);
    throw orderError; // Throw instead of returning null to trigger fallbacks
  }

  // Insert order items
  const orderItems = items.map((item) => ({
    order_id: order.id,
    menu_item_id: item.id,
    quantity: item.quantity,
    price: item.price,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) {
    console.error("Error creating order items:", itemsError);
  }

  // Track in analytics
  await trackOrder(shopId, tableId, items, totalPrice);

  return order;
}

/**
 * Track an order attempt for analytics.
 */
async function trackOrder(shopId, tableId, items, totalPrice) {
  if (!supabase) return;

  await supabase.from("analytics_orders").insert({
    shop_id: shopId,
    table_id: tableId,
    items: JSON.stringify(items.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price }))),
    total_price: totalPrice,
  });
}
