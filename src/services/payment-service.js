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
 * Verify that a payment has been completed.
 */
export async function verifyPayment(paymentId) {
  if (!supabase) {
    return { id: paymentId, status: "completed" };
  }

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .single();

  if (error) {
    console.error("Error verifying payment:", error);
    return null;
  }

  return data;
}
