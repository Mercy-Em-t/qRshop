import { supabase } from "./supabase-client";

/**
 * Track an upsell conversion (accepted or declined).
 */
export async function trackUpsell(itemId, upsellId, accepted) {
  if (!supabase) return;

  const { error } = await supabase.from("analytics_upsells").insert({
    item_id: itemId,
    upsell_id: upsellId,
    accepted,
  });

  if (error) {
    console.error("Error tracking upsell:", error);
  }
}

/**
 * Get order analytics for a shop: orders per day.
 */
export async function getOrdersPerDay(shopId, days = 7) {
  if (!supabase) return [];

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("analytics_orders")
    .select("*")
    .eq("shop_id", shopId)
    .gte("timestamp", since)
    .order("timestamp", { ascending: true });

  if (error) {
    console.error("Error fetching orders per day:", error);
    return [];
  }

  // Group by date
  const grouped = {};
  for (const order of data || []) {
    const date = new Date(order.timestamp).toLocaleDateString();
    if (!grouped[date]) {
      grouped[date] = { date, count: 0, revenue: 0 };
    }
    grouped[date].count += 1;
    grouped[date].revenue += order.total_price || 0;
  }

  return Object.values(grouped);
}

/**
 * Get popular menu items for a shop.
 */
export async function getPopularItems(shopId, limit = 10) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("analytics_orders")
    .select("items")
    .eq("shop_id", shopId);

  if (error) {
    console.error("Error fetching popular items:", error);
    return [];
  }

  // Aggregate item counts
  const itemCounts = {};
  for (const order of data || []) {
    let items;
    try {
      items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
    } catch {
      continue;
    }
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      const key = item.name || item.id;
      if (!itemCounts[key]) {
        itemCounts[key] = { name: item.name || key, count: 0 };
      }
      itemCounts[key].count += item.quantity || 1;
    }
  }

  return Object.values(itemCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Get upsell conversion rate for a shop's items.
 */
export async function getUpsellStats(shopId) {
  if (!supabase) return { total: 0, accepted: 0, rate: 0 };

  // Get all upsell items for this shop's menu items
  const { data: menuItems } = await supabase
    .from("menu_items")
    .select("id")
    .eq("shop_id", shopId);

  if (!menuItems || menuItems.length === 0) {
    return { total: 0, accepted: 0, rate: 0 };
  }

  const menuItemIds = menuItems.map((i) => i.id);

  const { data, error } = await supabase
    .from("analytics_upsells")
    .select("*")
    .in("item_id", menuItemIds);

  if (error) {
    console.error("Error fetching upsell stats:", error);
    return { total: 0, accepted: 0, rate: 0 };
  }

  const total = (data || []).length;
  const accepted = (data || []).filter((u) => u.accepted).length;
  const rate = total > 0 ? Math.round((accepted / total) * 100) : 0;

  return { total, accepted, rate };
}
