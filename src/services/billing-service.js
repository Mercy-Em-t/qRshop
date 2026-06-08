import { supabase } from "./supabase-client";
import { getCurrentUser } from "./auth-service";

/**
 * Fetch token balance and Okoa Jahazi details for a shop
 */
export async function getBillingDetails(shopId) {
  try {
    const { data, error } = await supabase
      .from("shops")
      .select("token_balance, okoa_jahazi_limit, okoa_jahazi_owed")
      .eq("shop_id", shopId)
      .single();

    if (error) throw error;
    
    // Default values if columns are newly added
    return {
      token_balance: data.token_balance || 0,
      okoa_jahazi_limit: data.okoa_jahazi_limit || 500,
      okoa_jahazi_owed: data.okoa_jahazi_owed || 0
    };
  } catch (err) {
    console.error("Failed to fetch billing details:", err);
    return { token_balance: 0, okoa_jahazi_limit: 0, okoa_jahazi_owed: 0 };
  }
}

/**
 * Request an Okoa Jahazi token advance
 */
export async function requestOkoaJahazi(shopId, amount) {
  try {
    const { data, error } = await supabase.rpc('request_okoa_jahazi', {
      p_shop_id: shopId,
      p_amount: amount
    });

    if (error) throw error;
    return data; // { success, message, net_tokens, fee }
  } catch (err) {
    console.error("Failed to request Okoa Jahazi:", err);
    return { success: false, message: err.message };
  }
}

/**
 * Fetch recent token transactions
 */
export async function getTokenTransactions(shopId, limit = 20) {
  try {
    const { data, error } = await supabase
      .from("token_transactions")
      .select("*")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Failed to fetch token transactions:", err);
    return [];
  }
}
