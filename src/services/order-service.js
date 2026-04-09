import { supabase } from "./supabase-client";
import { OrderGatewaySDK } from "../lib/gateway-sdk";

/**
 * Create an order record in the database before sending via WhatsApp.
 * This prevents spam and enables analytics tracking.
 */
export async function createOrder(shopId, tableId, items, totalPrice, discountAmount = 0, couponCode = null, clientName = null, clientPhone = null, parentOrderId = null, fulfillmentType = 'dine_in', deliveryAddress = null, deliveryFeeCharged = 0, clientEmail = null, appliedPromotion = null) {
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
    total_price: Number(totalPrice) || 0,
    discount_amount: Number(discountAmount) || 0,
    coupon_code: couponCode,
    client_name: clientName,
    client_phone: clientPhone,
    customer_email: clientEmail,
    parent_order_id: parentOrderId,
    fulfillment_type: fulfillmentType,
    delivery_address: deliveryAddress,
    delivery_fee_charged: Number(deliveryFeeCharged) || 0,
    items: items.map(i => ({ 
      id: i.id, 
      quantity: Number(i.quantity) || 1, 
      is_bundled: i.is_bundled || false 
    })),
    applied_promotion_id: appliedPromotion?.id || null
  };

  const { data: orderId, error: rpcError } = await supabase.rpc('checkout_cart', { payload });

  if (rpcError) {
    console.error("Secure Checkout RPC Error Full:", rpcError);
    const detailMsg = rpcError.details || rpcError.hint || "";
    if (rpcError.message.includes("Insufficient") || rpcError.message.includes("Invalid")) {
      throw new Error(`${rpcError.message} ${detailMsg}`);
    }
    throw new Error(`Checkout failed: ${rpcError.message}. ${detailMsg}`.trim());
  }

  // Track in analytics
  await trackOrder(shopId, tableId, items, totalPrice);

  // Phase 47: System A -> System B Synchronization
  try {
    pingExternalOrderGateway({
      orderId: orderId,
      clientName: clientName || "Anonymous",
      clientEmail: clientEmail || "",
      clientPhone: clientPhone || "N/A",
      shopId: shopId,
      fulfillmentType: fulfillmentType,
      items: items.map(i => ({ productId: i.id, qty: i.quantity, name: i.name, price: i.price })),
      total: totalPrice,
      deliveryAddress: deliveryAddress || "",
      notes: tableId ? `Table ${tableId}` : "",
      appliedPromotion: appliedPromotion // PASSING PROMO INFO FOR BUNDLE AWARENESS
    }).catch(e => console.warn("System B Background Sync Pending:", e));
  } catch (e) {
    console.error("System B Trigger Failed:", e);
  }

  return { id: orderId };
}

/**
 * Pings System B (Master Order Gateway) to synchronize the new order.
 * Ensures System B is aware of Bundles and Pricing.
 */
export async function pingExternalOrderGateway(payload) {
  const SYSTEM_B_URL = import.meta.env.VITE_SYSTEM_B_URL;
  const API_KEY = import.meta.env.VITE_SYSTEM_B_API_KEY;

  if (!API_KEY || !SYSTEM_B_URL) {
    console.warn("System B Integration Incomplete: Missing URL or API Key.");
    return;
  }

  const sdk = new OrderGatewaySDK(API_KEY, SYSTEM_B_URL);

  const gatewayOrder = {
    order_id: payload.orderId,
    customer: {
      name: payload.clientName || "Anonymous",
      email: payload.clientEmail || "",
      address: payload.deliveryAddress || payload.notes || "N/A"
    },
    items: payload.items.map(i => ({
      product_id: i.productId,
      quantity: i.qty
    })),
    total: payload.total || 0,
    payment_status: 'pending',
    // --- System B Metadata ---
    applied_promotion_id: payload.appliedPromotion?.id || null,
    promotion_name: payload.appliedPromotion?.name || null,
    source_system: "SAVANNAH_STOREFRONT_SYSTEM_A"
  };

  console.log(`[SYNC] System A -> System B: Order ${gatewayOrder.order_id}`);

  const result = await sdk.placeOrder(gatewayOrder);

  if (!result.success) {
    throw new Error(`System B Communication Error: ${result.error} - ${result.message}`);
  }

  console.log("System B Acceptance Received.");
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
