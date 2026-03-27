import { supabase } from "./supabase-client";

/**
 * Create an order record in the database before sending via WhatsApp.
 * This prevents spam and enables analytics tracking.
 */
export async function createOrder(shopId, tableId, items, totalPrice, discountAmount = 0, couponCode = null, clientName = null, clientPhone = null, parentOrderId = null, fulfillmentType = 'dine_in', deliveryAddress = null, deliveryFeeCharged = 0, clientEmail = null) {
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
      client_email: clientEmail,
      parent_order_id: parentOrderId,
      fulfillment_type: fulfillmentType,
      delivery_address: deliveryAddress,
      delivery_fee_charged: deliveryFeeCharged,
      status: "pending",
      created_at: new Date().toISOString(),
    };
  }

  const payload = {
    shop_id: shopId,
    table_id: tableId,
    total_price: totalPrice,
    discount_amount: discountAmount,
    coupon_code: couponCode,
    client_name: clientName,
    client_phone: clientPhone,
    customer_email: clientEmail,
    parent_order_id: parentOrderId,
    fulfillment_type: fulfillmentType,
    delivery_address: deliveryAddress,
    delivery_fee_charged: deliveryFeeCharged,
    items: items.map(i => ({ id: i.id, quantity: i.quantity }))
  };

  const { data: orderId, error: rpcError } = await supabase.rpc('checkout_cart', { payload });

  if (rpcError) {
    console.error("Secure Checkout Error:", rpcError);
    // Suppress general cryptic errors but pass through readable ones like "Insufficient stock"
    if (rpcError.message.includes("Insufficient") || rpcError.message.includes("Invalid")) {
      throw new Error(rpcError.message);
    }
    throw new Error("Unable to complete checkout at this time. Please try again.");
  }

  // Track in analytics
  await trackOrder(shopId, tableId, items, totalPrice);

  // Return a shell mimicking the old return object for frontend compatibility
  return { id: orderId };
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
