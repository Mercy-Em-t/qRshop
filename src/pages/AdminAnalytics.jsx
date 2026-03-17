import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { getCurrentUser } from "../services/auth-service";

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [stats, setStats] = useState({
     totalShops: 0,
     activeOrders: 0,
     totalGMV: 0,
     pendingGMV: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "system_admin") {
      navigate("/login");
      return;
    }
    fetchGlobalStats();
  }, [user, navigate]);

  const fetchGlobalStats = async () => {
    try {
      setLoading(true);
      
      // 1. Total Shops
      const { count: shopCount } = await supabase
        .from("shops")
        .select('*', { count: 'exact', head: true });

      // 2. Global Orders Aggregation
      const { data: allOrders, error } = await supabase
        .from("orders")
        .select("total, status");

      if (error) throw error;

      let activeOrdersCount = 0;
      let totalCompletedVolume = 0;
      let totalPendingVolume = 0;

      if (allOrders) {
         allOrders.forEach(o => {
            if (o.status.includes('paid') || o.status.includes('completed')) {
               totalCompletedVolume += Number(o.total || 0);
            } else if (o.status !== 'archived' && o.status !== 'cancelled') {
               activeOrdersCount++;
               totalPendingVolume += Number(o.total || 0);
            }
         });
      }

      setStats({
         totalShops: shopCount || 0,
         activeOrders: activeOrdersCount,
         totalGMV: totalCompletedVolume,
         pendingGMV: totalPendingVolume
      });

    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-gray-900 shadow-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <Link to="/admin" className="text-gray-400 hover:text-white transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
             </Link>
             <h1 className="text-xl font-bold text-white flex items-center gap-2">
                📈 Aggregated Analytics
             </h1>
          </div>
          <button onClick={fetchGlobalStats} className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg border border-gray-700 transition flex items-center gap-2">
             <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
             Refresh
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
         <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full"></div>
               <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Total Tenants</h3>
               {loading ? (
                  <div className="h-10 bg-gray-100 rounded w-16 animate-pulse"></div>
               ) : (
                  <div className="text-4xl font-black text-gray-900">{stats.totalShops}</div>
               )}
               <p className="text-xs text-gray-400 mt-2">Active shops on the platform</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full"></div>
               <h3 className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-2">Active Pending Orders</h3>
               {loading ? (
                  <div className="h-10 bg-gray-100 rounded w-16 animate-pulse"></div>
               ) : (
                  <div className="text-4xl font-black text-amber-700">{stats.activeOrders}</div>
               )}
               <p className="text-xs text-amber-600/60 mt-2">Currently awaiting fulfillment</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden lg:col-span-2 shadow-xl ring-1 ring-green-900/5">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-600"></div>
               <h3 className="text-sm font-bold text-green-700 uppercase tracking-wider mb-2">Lifetime Platform GMV</h3>
               {loading ? (
                  <div className="h-12 bg-gray-100 rounded w-48 animate-pulse"></div>
               ) : (
                  <div className="text-5xl font-black text-gray-900 tracking-tight">
                     <span className="text-2xl text-green-500 mr-2">KSh</span>
                     {stats.totalGMV.toLocaleString()}
                  </div>
               )}
               <p className="text-sm text-gray-500 mt-3 font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Plus <strong className="text-gray-800">KSh {stats.pendingGMV.toLocaleString()}</strong> in uncaptured pending volume
               </p>
            </div>

         </div>
      </main>
    </div>
  );
}
