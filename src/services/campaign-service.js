import { supabase } from "./supabase-client";

export async function getCampaignById(campaignId) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();

  if (error) {
    console.error("Error fetching campaign:", error);
    return null;
  }

  return data;
}

export async function getShopCampaigns(shopId) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching campaigns:", error);
    return [];
  }

  return data || [];
}

export async function createCampaign(campaignData) {
  if (!supabase) return { error: new Error("Supabase client not initialized") };

  const { data, error } = await supabase
    .from("campaigns")
    .insert([campaignData])
    .select();

  return { data, error };
}

export async function updateCampaign(campaignId, updates) {
  if (!supabase) return { error: new Error("Supabase client not initialized") };

  const { data, error } = await supabase
    .from("campaigns")
    .update(updates)
    .eq("id", campaignId)
    .select();

  return { data, error };
}

export async function deleteCampaign(campaignId) {
  if (!supabase) return { error: new Error("Supabase client not initialized") };

  const { error } = await supabase
    .from("campaigns")
    .delete()
    .eq("id", campaignId);

  return { error };
}

// Analytics for a campaign
export async function getCampaignMetrics(campaignId) {
  if (!supabase) return { totalScans: 0, conversionRate: 0 };

  const { data: events, error } = await supabase
    .from("events")
    .select("event_type")
    .eq("campaign_id", campaignId);

  if (error) {
    console.error("Error fetching campaign metrics:", error);
    return { totalScans: 0, conversionRate: 0 };
  }

  const scans = events?.filter(e => e.event_type === "reward_claimed").length || 0;
  const orders = events?.filter(e => e.event_type === "order_completed" || e.event_type === "order_started").length || 0;
  
  const conversionRate = scans > 0 ? (orders / scans) * 100 : 0;

  return {
    totalScans: scans,
    conversions: orders,
    conversionRate: conversionRate.toFixed(1)
  };
}
