import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser } from "../services/auth-service";
import { supabase } from "../services/supabase-client";
import LoadingSpinner from "../components/LoadingSpinner";

export default function DeliveryPortal() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    active: 0,
    completedToday: 0
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const roles = ['delivery_manager', 'delivery_worker', 'system_admin'];
    if (!roles.includes(user.role) && user.plan !== 'business') {
      navigate("/dashboard");
      return;
    }

    async function fetchStats() {
      try {
        const { data: counts } = await supabase
          .from('orders')
          .select('id, delivery_status')
          .neq('delivery_status', 'none');

        const pending = counts.filter(o => o.delivery_status === 'pending_pickup').length;
        const active = counts.filter(o => ['picked_up', 'dispatched'].includes(o.delivery_status)).length;
        const completed = counts.filter(o => o.delivery_status === 'delivered').length;

        setStats({ pending, active, completedToday: completed });
      } catch (e) {
        console.error("Stats fetch failed", e);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  if (loading) return <LoadingSpinner message="Opening Delivery Hub..." />;

  const isManager = ['delivery_manager', 'system_admin'].includes(user.role) || user.plan === 'business';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚚</span>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Delivery Hub</h1>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Last-Mile Logistics</p>
            </div>
          </div>
          <Link to="/dashboard" className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition font-bold">Back to Dashboard</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
             <p className="text-xs font-bold text-slate-400 uppercase mb-1">Pending Pickups</p>
             <p className="text-2xl font-black text-orange-600">{stats.pending}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
             <p className="text-xs font-bold text-slate-400 uppercase mb-1">In Transit</p>
             <p className="text-2xl font-black text-blue-600">{stats.active}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
             <p className="text-xs font-bold text-slate-400 uppercase mb-1">Delivered Today</p>
             <p className="text-2xl font-black text-green-600">{stats.completedToday}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Worker Action Card */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 flex flex-col group hover:border-green-500 transition-all duration-300">
            <div className="p-8 flex-1">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">🚲</div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Deliverer's Console</h2>
              <p className="text-slate-500 leading-relaxed mb-6">
                Pickup new orders from shops, navigate to customer locations, and update delivery status in real-time.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <span className="text-green-500 font-bold">✓</span> View assigned pickups
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <span className="text-green-500 font-bold">✓</span> Integrated customer contact
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-600">
                  <span className="text-green-500 font-bold">✓</span> Real-time status sync
                </li>
              </ul>
            </div>
            <Link 
              to="/dashboard/delivery/worker" 
              className="bg-slate-900 hover:bg-slate-800 text-white py-5 text-center font-bold text-lg transition-colors"
            >
              Start Shift
            </Link>
          </div>

          {/* Manager Action Card */}
          {isManager ? (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 flex flex-col group hover:border-blue-500 transition-all duration-300">
              <div className="p-8 flex-1">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">📊</div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3">Fleet Management</h2>
                <p className="text-slate-500 leading-relaxed mb-6">
                  Monitor all delivery orders, manage rider payouts, and optimize routes for maximum efficiency.
                </p>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                   <p className="text-xs font-bold text-blue-800 mb-1 tracking-tight">MANAGER PRIVILEGED ACCESS</p>
                   <p className="text-xs text-blue-600 font-medium">Full visibility of logistics financials and performance.</p>
                </div>
              </div>
              <Link 
                to="/dashboard/delivery/manager" 
                className="bg-blue-600 hover:bg-blue-700 text-white py-5 text-center font-bold text-lg transition-colors"
              >
                Access Dashboard
              </Link>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 p-8 flex flex-col items-center justify-center text-center opacity-75">
               <div className="text-4xl mb-4">🔒</div>
               <h3 className="text-xl font-bold text-slate-400 mb-2">Manager Console</h3>
               <p className="text-sm text-slate-400 mb-6">Manager access is restricted to supervisors and business administrators.</p>
               <div className="bg-slate-200 px-4 py-2 rounded-full text-[10px] font-black text-slate-500 tracking-widest uppercase">Contact Admin to Upgrade</div>
            </div>
          )}
        </div>

        {/* Informational Footer */}
        <div className="mt-12 p-6 bg-slate-900 rounded-2xl text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
           <div>
              <h3 className="font-bold text-lg leading-tight">Route Optimization Active</h3>
              <p className="text-slate-400 text-xs">Our system automatically groups orders on similar paths to maximize your earnings per trip.</p>
           </div>
           <div className="flex items-center gap-4">
              <div className="text-right">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Network Status</p>
                 <p className="text-xs font-black text-green-400 uppercase">Operational - 100%</p>
              </div>
              <div className="w-10 h-10 rounded-full border-2 border-green-500/30 flex items-center justify-center text-xl">🛰️</div>
           </div>
        </div>
      </main>
    </div>
  );
}
