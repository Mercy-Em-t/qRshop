import { useState, useEffect } from "react";
import { supabase } from "../services/supabase-client";
import { Link } from "react-router-dom";

export default function MultiShopNoticeboard({ userId }) {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) fetchGlobalStatus();
  }, [userId]);

  const fetchGlobalStatus = async () => {
    try {
      // 1. Fetch all shops linked to this user
      const { data: profiles } = await supabase
        .from("shop_users")
        .select("shop_id, shops(name)")
        .eq("id", userId);

      if (!profiles) return;

      // 2. Aggregate pending orders for each shop
      const shopStats = await Promise.all(
        profiles.map(async (p) => {
          const { count } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("shop_id", p.shop_id)
            .eq("status", "pending");

          return {
            shopId: p.shop_id,
            shopName: p.shops?.name || "Unnamed Shop",
            pendingCount: count || 0
          };
        })
      );

      setSummaries(shopStats);
    } catch (err) {
      console.error("Global Monitor Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  const totalPending = summaries.reduce((sum, s) => sum + s.pendingCount, 0);
  if (totalPending === 0) return null;

  return (
    <div className="bg-indigo-900 text-white rounded-3xl p-6 shadow-2xl relative overflow-hidden mb-8 border border-white/10 animate-in slide-in-from-top duration-500">
      <div className="absolute top-0 right-0 w-32 h-32 bg-theme-accent/20 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse"></div>
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-indigo-300">Live Noticeboard</h3>
          <p className="text-2xl font-black text-white italic tracking-tighter">Global Hub Status</p>
        </div>
        <div className="bg-theme-accent text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-amber-500/20">
           <span className="w-1.5 h-1.5 bg-black rounded-full animate-ping"></span>
           {totalPending} Active Orders
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 relative z-10">
        {summaries.filter(s => s.pendingCount > 0).map((summary) => (
          <div key={summary.shopId} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/5 hover:bg-white/20 transition-all group">
            <p className="text-[9px] font-black uppercase tracking-widest text-indigo-200 mb-1 opacity-60">System Node</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold truncate pr-2">{summary.shopName}</span>
              <span className="bg-indigo-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg group-hover:scale-110 transition-transform">
                {summary.pendingCount}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 flex items-center justify-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-indigo-300/60 pb-1">
         <span className="flex items-center gap-1">📡 Telemetry: OK</span>
         <span className="flex items-center gap-1">⛓️ Sync: Active</span>
         <span className="flex items-center gap-1">🔐 Auth: Master</span>
      </div>
    </div>
  );
}
