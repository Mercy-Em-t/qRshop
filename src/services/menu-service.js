import { supabase } from "./supabase-client";

export async function getMenuItems(shopId) {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*, product_images(url, position)")
      .eq("shop_id", shopId)
      .neq("is_active", false)
      .order("category", { ascending: true });

    if (!error && data) return data;

    const { data: fallbackData, error: fallbackErr } = await supabase
      .from("menu_items")
      .select("*")
      .eq("shop_id", shopId)
      .neq("is_active", false)
      .order("category", { ascending: true });

    if (fallbackErr) {
      console.error("Error fetching menu items fallback:", fallbackErr);
      return [];
    }
    return fallbackData || [];
  } catch (err) {
    console.error("Error in getMenuItems:", err);
    return [];
  }
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

export async function getMenuItemById(itemId) {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*, product_images(url, position)")
      .eq("id", itemId)
      .single();

    if (!error && data) return data;

    const { data: fallbackData, error: fallbackErr } = await supabase
      .from("menu_items")
      .select("*")
      .eq("id", itemId)
      .single();

    if (fallbackErr) {
      console.error("Error fetching menu item fallback:", fallbackErr);
      return null;
    }
    return fallbackData;
  } catch (err) {
    console.error("Error in getMenuItemById:", err);
    return null;
  }
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

export async function getRelatedItems(shopId, category, excludeId) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("menu_items")
    .select("*, product_images(url)")
    .eq("shop_id", shopId)
    .eq("category", category)
    .neq("id", excludeId)
    .neq("is_active", false)
    .limit(10);

  if (error) {
    console.error("Error fetching related items:", error);
    return [];
  }

  return data || [];
}
