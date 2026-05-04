import { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabase-client";

/**
 * useVisitStats — Real-time shop traffic metrics
 *
 * Tracks total visits (shop_profile_view and qr_scanned events),
 * the day-over-day visit trend, and conversion from visits to orders.
 */
export function useVisitStats(shopId) {
  const [stats, setStats] = useState({
    totalVisits: 0,
    visitsToday: 0,
    visitsYesterday: 0,
    trend: 0,
    conversionToOrder: 0,
    loading: true,
  });

  const fetchStats = useCallback(async () => {
    if (!shopId || !supabase) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      const yesterdayStart = new Date(todayStart);
      yesterdayStart.setDate(todayStart.getDate() - 1);

      // 1. Fetch all visit events for this shop (both profile views and QR scans)
      const { data: events } = await supabase
        .from("events")
        .select("created_at, event_type")
        .eq("shop_id", shopId)
        .in("event_type", ["shop_profile_view", "qr_scanned"]);

      // 2. Fetch order count to compute visit → order percentage
      const { data: orders } = await supabase
        .from("orders")
        .select("id")
        .eq("shop_id", shopId);

      const totalVisits = events ? events.length : 0;
      const visitsToday = (events || []).filter(
        e => new Date(e.created_at || new Date()) >= todayStart
      ).length;

      const visitsYesterday = (events || []).filter(e => {
        const d = new Date(e.created_at || new Date());
        return d >= yesterdayStart && d < todayStart;
      }).length;

      const trend = visitsYesterday > 0
        ? Math.round(((visitsToday - visitsYesterday) / visitsYesterday) * 100)
        : visitsToday > 0 ? 100 : 0;

      const totalOrders = orders ? orders.length : 0;
      const conversionToOrder = totalVisits > 0 ? Math.round((totalOrders / totalVisits) * 100) : 0;

      setStats({
        totalVisits,
        visitsToday,
        visitsYesterday,
        trend,
        conversionToOrder: Math.min(conversionToOrder, 100),
        loading: false,
      });
    } catch (err) {
      console.warn("Error loading traffic metrics:", err);
      setStats(prev => ({ ...prev, loading: false }));
    }
  }, [shopId]);

  useEffect(() => {
    fetchStats();
  }, [shopId, fetchStats]);

  return { stats, refetch: fetchStats };
}
