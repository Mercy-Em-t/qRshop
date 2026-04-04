import { supabase } from "./supabase-client";
import { OrderGatewaySDK } from "../lib/gateway-sdk";

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
      items: items.map(i => ({ productId: i.id, qty: i.quantity, name: i.name, price: i.price })),
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
  const GATEWAY_URL = import.meta.env.VITE_MASTER_ORDER_GATEWAY_URL || "https://your-master-gateway.vercel.app/api/external";
  const API_KEY = import.meta.env.VITE_MASTER_ORDER_GATEWAY_API_KEY;

  if (!API_KEY) {
    console.warn("Master Order Gateway API Key missing. Skipping external notification.");
    return;
  }

  const sdk = new OrderGatewaySDK(API_KEY, GATEWAY_URL);

  // Phase 48: Standardize Phone Format (+COUNTRYCODE 9Digits OR 10Digits Local)
  let rawPhone = (payload.clientPhone || "").replace(/[^0-9+]/g, '');
  let formattedPhone = rawPhone;

  if (!rawPhone.startsWith('+') && rawPhone.startsWith('0') && rawPhone.length === 10) {
      formattedPhone = rawPhone;
  } else if (!rawPhone.startsWith('+') && rawPhone.length === 9) {
      formattedPhone = rawPhone;
  }

  const SHOP_ID = import.meta.env.VITE_MASTER_ORDER_GATEWAY_SHOP_ID;

  const gatewayOrder = {
    customerName: payload.clientName || "Anonymous",
    phone: formattedPhone,
    shopId: SHOP_ID || payload.shopId,
    deliveryType: payload.fulfillmentType === 'delivery' ? 'delivery' : 'pickup',
    items: payload.items.map(i => ({
      productId: i.productId,
      qty: i.qty,
      name: i.name,
      price: i.price,
      subtotal: i.subtotal || (i.price ? i.price * i.qty : undefined)
    })),
    location: payload.deliveryAddress || "",
    notes: payload.notes || ""
  };

  console.log("Pinging Master Order Gateway for shop:", payload.shopId);

  const result = await sdk.placeOrder(gatewayOrder);

  if (!result.success) {
    throw new Error(`Gateway Error: ${result.error} - ${result.message}`);
  }

  console.log("Master Order Gateway - Tracking Link:", result.trackingUrl);
  return result;
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
