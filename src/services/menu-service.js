import { supabase } from './supabase-client'

export async function fetchMenuItems(shopId) {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('shop_id', shopId)

  if (error) throw error
  return data
}

export async function fetchUpsellItems(itemId) {
  const { data, error } = await supabase
    .from('upsell_items')
    .select('*, menu_items!upsell_id(*)')
    .eq('item_id', itemId)

  if (error) throw error
  return data
import { supabase } from "./supabase-client";

export async function getMenuItems(shopId) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("shop_id", shopId)
    .order("category", { ascending: true });

  if (error) {
    console.error("Error fetching menu items:", error);
    return [];
  }

  return data || [];
}

export async function getUpsellItems(itemId) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("upsell_items")
    .select("*, menu_items!upsell_items_upsell_id_fkey(*)")
    .eq("item_id", itemId);

  if (error) {
    console.error("Error fetching upsell items:", error);
    return [];
  }

  return data || [];
}

export async function getMenuItemsByCategory(shopId) {
  const items = await getMenuItems(shopId);
  const categories = {};

  for (const item of items) {
    const category = item.category || "Uncategorized";
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(item);
  }

  return categories;
}
