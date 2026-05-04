import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../services/supabase-client";

/**
 * useConversionStats — Real-time product conversion intelligence
 *
 * Tracks all customer interaction avenues:
 *   1. Upsell modal interactions (accept/decline) → from analytics_upsells
 *   2. Orders placed vs total QR sessions → from orders table
 *   3. Derives a unified "Product Conversion Rate" across all touchpoints
 *
 * Subscribes to Supabase Realtime channels so numbers update live
 * whenever a customer accepts an upsell or places a new order.
 */
export function useConversionStats(shopId) {
  const [stats, setStats] = useState({
    // Upsell metrics
    upsellTotal: 0,
    upsellAccepted: 0,
    upsellRate: 0,

    // Order conversion metrics (sessions → completed orders)
    ordersToday: 0,
    ordersThisWeek: 0,
    revenueToday: 0,

    // Unified conversion signal across all touchpoints
    overallRate: 0,
    totalInteractions: 0,
    totalConversions: 0,

    // Trend: difference vs yesterday (positive = improving)
    trend: null,

    loading: true,
    lastUpdated: null,
  });

  const channelsRef = useRef([]);

  const fetchStats = useCallback(async () => {
    if (!shopId) return;

    try {
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(todayStart.getDate() - 1);

      // ── 1. Fetch all menu_item IDs for this shop (needed to scope upsells) ──
      const { data: menuItems } = await supabase
        .from("menu_items")
        .select("id")
        .eq("shop_id", shopId);

      const itemIds = (menuItems || []).map((i) => i.id);

      // ── 2. Upsell stats (all time for rate, scoped to this shop's items) ──
      let upsellTotal = 0;
      let upsellAccepted = 0;

      if (itemIds.length > 0) {
        const { data: upsells } = await supabase
          .from("analytics_upsells")
          .select("accepted")
          .in("item_id", itemIds);

        if (upsells) {
          upsellTotal = upsells.length;
          upsellAccepted = upsells.filter((u) => u.accepted).length;
        }
      }

      const upsellRate =
        upsellTotal > 0 ? Math.round((upsellAccepted / upsellTotal) * 100) : 0;

      // ── 3. Order conversion: today vs yesterday trend ──
      const { data: ordersWeek } = await supabase
        .from("orders")
        .select("created_at, total_price, status")
        .eq("shop_id", shopId)
        .gte("created_at", weekStart.toISOString())
        .in("status", ["completed", "confirmed", "delivered", "paid"]);

      const ordersToday = (ordersWeek || []).filter(
        (o) => new Date(o.created_at) >= todayStart
      );
      const ordersYesterday = (ordersWeek || []).filter((o) => {
        const d = new Date(o.created_at);
        return d >= yesterdayStart && d < todayStart;
      });

      const revenueToday = ordersToday.reduce(
        (sum, o) => sum + (o.total_price || 0),
        0
      );

      const trend =
        ordersYesterday.length > 0
          ? ordersToday.length - ordersYesterday.length
          : null;

      // ── 4. Unified conversion rate ──
      // Total interactions = upsell presentations + all orders this week
      // Total conversions = upsell accepts + completed orders this week
      const totalWeekOrders = (ordersWeek || []).length;
      const totalInteractions = upsellTotal + totalWeekOrders;
      const totalConversions = upsellAccepted + totalWeekOrders; // every completed order = a conversion
      const overallRate =
        totalInteractions > 0
          ? Math.round((totalConversions / totalInteractions) * 100)
          : 0;

      setStats({
        upsellTotal,
        upsellAccepted,
        upsellRate,
        ordersToday: ordersToday.length,
        ordersThisWeek: totalWeekOrders,
        revenueToday,
        overallRate,
        totalInteractions,
        totalConversions,
        trend,
        loading: false,
        lastUpdated: new Date(),
      });
    } catch (err) {
      console.error("useConversionStats: fetch failed", err);
      setStats((prev) => ({ ...prev, loading: false }));
    }
  }, [shopId]);

  useEffect(() => {
    if (!shopId) return;

    // Initial fetch
    fetchStats();

    // ── Subscribe to analytics_upsells inserts (upsell modal interactions) ──
    const upsellChannel = supabase
      .channel(`conv-upsells-${shopId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "analytics_upsells",
        },
        () => {
          // Debounced refetch on any new upsell event
          fetchStats();
        }
      )
      .subscribe();

    // ── Subscribe to orders INSERT/UPDATE for this shop (new orders or status changes) ──
    const ordersChannel = supabase
      .channel(`conv-orders-${shopId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT and UPDATE both matter (status change = completion)
          schema: "public",
          table: "orders",
          filter: `shop_id=eq.${shopId}`,
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    channelsRef.current = [upsellChannel, ordersChannel];

    return () => {
      channelsRef.current.forEach((ch) => supabase.removeChannel(ch));
      channelsRef.current = [];
    };
  }, [shopId, fetchStats]);

  return { stats, refetch: fetchStats };
}
