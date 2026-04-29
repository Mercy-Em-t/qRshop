/**
 * Payment service for handling M-Pesa / Stripe payment integration.
 * This provides the frontend interface; actual payment processing
 * would be handled by Supabase Edge Functions or external APIs.
 */

import { supabase } from "./supabase-client";

/**
 * Create a payment intent for an order.
 */
export async function createPayment(orderId, amount, method) {
  if (!supabase) {
    return {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      order_id: orderId,
      amount,
      method,
      status: "pending",
      created_at: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase
    .from("payments")
    .insert({
      order_id: orderId,
      amount,
      method,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating payment:", error);
    return null;
  }

  return data;
}

/**
 * Trigger an M-Pesa STK Push (Lipa Na M-Pesa Online)
 * This calls a Supabase Edge Function which handles the Safaricom Daraja API.
 */
export async function triggerMpesaStkPush(orderId, phone, amount, shopId) {
  if (!supabase) {
    console.warn("Supabase not initialized, skipping STK push");
    return { success: true, message: "Mock STK push triggered" };
  }

  // Format phone: ensure it starts with 254
  let formattedPhone = phone.replace(/\D/g, '');
  if (formattedPhone.startsWith('0')) formattedPhone = '254' + formattedPhone.substring(1);
  if (formattedPhone.startsWith('7')) formattedPhone = '254' + formattedPhone;
  if (formattedPhone.startsWith('1')) formattedPhone = '254' + formattedPhone;

  try {
    const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
      body: { 
        order_id: orderId,
        phone: formattedPhone,
        amount: Math.round(amount), // M-Pesa expects integers
        shop_id: shopId
      }
    });

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error("STK Push Failed:", err);
    return { success: false, error: err.message };
  }
}

