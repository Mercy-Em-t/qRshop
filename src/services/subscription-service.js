import { supabase } from "./supabase-client";

/**
 * Get the subscription for a shop.
 */
export async function getSubscription(shopId) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("shop_id", shopId)
    .eq("status", "active")
    .order("end_date", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // No active subscription is a normal case
    return null;
  }

  return data;
}

/**
 * Create a subscription for a shop.
 */
export async function createSubscription(shopId, planType) {
  if (!supabase) return null;

  const startDate = new Date().toISOString();
  const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      shop_id: shopId,
      plan_type: planType,
      start_date: startDate,
      end_date: endDate,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating subscription:", error);
    return null;
  }

  return data;
}

/**
 * Check if a shop has an active paid plan.
 */
export async function hasActivePaidPlan(shopId) {
  const sub = await getSubscription(shopId);
  if (!sub) return false;
  return sub.plan_type === "paid" && new Date(sub.end_date) > new Date();
}
