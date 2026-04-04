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

  // Phase 47: SaaS Master Order Gateway Integration
  // This pings the official SaaS platform to notify about the new order.
  try {
    pingExternalOrderGateway({
      clientName: clientName || "Anonymous",
      clientPhone: clientPhone || "N/A",
      shopId: shopId,
      fulfillmentType: (fulfillmentType === 'delivery') ? 'delivery' : 'pickup',
      items: items.map(i => ({ productId: i.id, qty: i.quantity })),
      deliveryAddress: deliveryAddress || "",
      notes: tableId ? `Table ${tableId}` : ""
    }).catch(e => console.warn("External Gateway Background Sync Pending:", e));
  } catch (e) {
    console.error("External Gateway Trigger Failed:", e);
  }

  // Return a shell mimicking the old return object for frontend compatibility
  return { id: orderId };
}

/**
 * Pings the Master Order Gateway (SaaS Platform) to synchronize the order.
 */
export async function pingExternalOrderGateway(payload) {
  const GATEWAY_URL = "https://v2-ruby-sigma.vercel.app/api/external/orders";
  const API_KEY = import.meta.env.VITE_MASTER_ORDER_GATEWAY_API_KEY;

  if (!API_KEY) {
    console.warn("Master Order Gateway API Key missing. Skipping external notification.");
    return;
  }

  // Phase 48: Standardize Phone Format (+COUNTRYCODE 9Digits OR 10Digits Local)
  let rawPhone = (payload.clientPhone || "").replace(/[^0-9+]/g, '');
  let formattedPhone = rawPhone;

  // Logic: +COUNTRYCODE 9 DIGITS or 10 DIGITS IF NOT USING COUNTRY CODE
  if (!rawPhone.startsWith('+') && rawPhone.startsWith('0') && rawPhone.length === 10) {
      // Standard 10-digit local number
      formattedPhone = rawPhone;
  } else if (!rawPhone.startsWith('+') && rawPhone.length === 9) {
      // Possible missing country code but matches the 9-digit rule? 
      // We'll leave it or you can add a default country code if needed.
      // For now, we strip and keep.
      formattedPhone = rawPhone;
  }

  const cleanPayload = {
    ...payload,
    clientPhone: formattedPhone
  };

  console.log("Pinging Master Order Gateway for shop:", payload.shopId);

  const response = await fetch(GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: JSON.stringify(cleanPayload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Gateway Error (${response.status}): ${errorData.message || response.statusText}`);
  }

  const data = await response.json();
  console.log("Master Order Gateway - Tracking Link:", data.trackingUrl);
  return data;
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
