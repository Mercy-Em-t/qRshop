import { supabase } from "./supabase-client.js";
import { OrderGatewaySDK, type SystemBOrderInput } from "../lib/gateway-sdk.js";
import { NotificationService } from "./notification-service.js";
import { getShop } from "./shop-service.js";

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  is_bundled?: boolean;
}

export interface Promotion {
  id: string;
  name: string;
}

/**
 * Create an order record in the database before sending via WhatsApp.
 */
export async function createOrder(
  shopId: string,
  tableId: string | null,
  items: OrderItem[],
  totalPrice: number,
  discountAmount: number = 0,
  couponCode: string | null = null,
  clientName: string | null = null,
  clientPhone: string | null = null,
  parentOrderId: string | null = null,
  fulfillmentType: string = 'dine_in',
  deliveryAddress: string | null = null,
  deliveryFeeCharged: number = 0,
  clientEmail: string | null = null,
  appliedPromotion: Promotion | null = null
): Promise<{ id: string } | any> {
  if (!supabase) {
    return {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
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

  // Track in analytics (Fire and forget or awaited depending on preference)
  trackOrder(shopId, tableId, items, totalPrice).catch(e => console.error("Analytics Error:", e));

  // Phase 47: System A -> System B Synchronization
  try {
    pingExternalOrderGateway({
      orderId: orderId as string,
      clientName: clientName || "Anonymous",
      clientEmail: clientEmail || "",
      clientPhone: clientPhone || "N/A",
      shopId: shopId,
      fulfillmentType: fulfillmentType,
      items: items.map(i => ({ productId: i.id, qty: i.quantity, name: i.name, price: i.price })),
      total: totalPrice,
      deliveryAddress: deliveryAddress || "",
      notes: tableId ? `Table ${tableId}` : "",
      appliedPromotion: appliedPromotion
    }).catch(e => console.warn("System B Background Sync Pending:", e));
  } catch (e) {
    console.error("System B Trigger Failed:", e);
  }

  return { id: orderId as string };
}

interface PingPayload {
  orderId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  shopId: string;
  fulfillmentType: string;
  items: Array<{ productId: string; qty: number; name: string; price: number }>;
  total: number;
  deliveryAddress: string;
  notes: string;
  appliedPromotion: Promotion | null;
}

/**
 * Pings System B (Master Order Gateway) to synchronize the new order.
 */
export async function pingExternalOrderGateway(payload: PingPayload) {
  const SYSTEM_B_URL = (import.meta as any).env.VITE_SYSTEM_B_URL;
  const API_KEY = (import.meta as any).env.VITE_SYSTEM_B_API_KEY;

  if (!API_KEY || !SYSTEM_B_URL) {
    console.warn("System B Integration Incomplete: Missing URL or API Key.");
    return;
  }

  const sdk = new OrderGatewaySDK(API_KEY, SYSTEM_B_URL);

  const gatewayOrder: SystemBOrderInput = {
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
    applied_promotion_id: (payload.appliedPromotion?.id as any) || undefined,
    promotion_name: (payload.appliedPromotion?.name as any) || undefined
  };

  console.debug(`[SYNC] System A -> System B: Order ${gatewayOrder.order_id}`);

  const result = await sdk.placeOrder(gatewayOrder);

  if (!result.success) {
    throw new Error(`System B Communication Error: ${result.error} - ${result.message}`);
  }

  console.debug("System B Acceptance Received.");
  return result;
}

/**
 * Track an order attempt for analytics.
 */
async function trackOrder(shopId: string, tableId: string | null, items: OrderItem[], totalPrice: number) {
  if (!supabase) return;

  await supabase.from("analytics_orders").insert({
    shop_id: shopId,
    table_id: tableId,
    items: JSON.stringify(items.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price }))),
    total_price: totalPrice,
  });
}

/**
 * Updates an order status and triggers a notification.
 */
export async function updateOrderStatus(orderId: string, newStatus: string) {
  if (!supabase) return;

  // 1. Fetch order details to get shop and customer info
  const { data: order, error: fetchError } = await supabase
    .from("orders")
    .select("*, shops(name)")
    .eq("id", orderId)
    .single();

  if (fetchError || !order) {
    console.error("Order not found during status update:", fetchError);
    return;
  }

  // 2. Update status in database
  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: newStatus })
    .eq("id", orderId);

  if (updateError) throw updateError;

  // 3. Trigger Notification Protocol
  try {
     const shopName = order.shops?.name || "The Shop";
     NotificationService.triggerStatusUpdate(
        {
           orderId: order.id,
           shopName: shopName,
           clientName: order.client_name,
           clientPhone: order.client_phone
        },
        newStatus
     );
  } catch (e) {
     console.warn("Notification trigger failed:", e);
  }

  // 4. Sync with System B if necessary
  // (Assuming System B also cares about status updates)
}
