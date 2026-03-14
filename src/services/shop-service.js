import { supabase } from "./supabase-client";

export async function getShop(shopId) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("id", shopId)
    .single();

  if (error) {
    console.error("Error fetching shop:", error);
    return null;
  }

  return data;
}

export async function getTable(shopId, tableNumber) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("tables")
    .select("*")
    .eq("shop_id", shopId)
    .eq("table_number", tableNumber)
    .single();

  if (error) {
    console.error("Error fetching table:", error);
    return null;
  }

  return data;
}
