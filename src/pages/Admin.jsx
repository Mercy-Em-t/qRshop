import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentUser, logout } from "../services/auth-service";
import { supabase } from "../services/supabase-client";

export default function Admin() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
     totalShops: 0, premiumShops: 0, orphanedShops: 0,
     lifetimeGMV: 0, pendingGMV: 0, activeOrders: 0, staleOrders: 0,
     totalOrders: 0
  });

  useEffect(() => {
    if (!user || user.role !== "system_admin") {
      navigate("/login");
      return;
    }
    fetchGodMode();
  }, [user, navigate]);

  const fetchGodMode = async () => {
     try {
        setLoading(true);
        const newAlerts = [];

        // 1. Ecosystem Data
        const { data: shops } = await supabase.from("shops").select("id, name, plan");
        const { data: items } = await supabase.from("menu_items").select("shop_id");
        
        const totalShops = shops?.length || 0;
        const premiumShops = shops?.filter(s => ['basic', 'pro', 'business'].includes(s.plan)).length || 0;
        
        const shopsWithItems = new Set(items?.map(i => i.shop_id));
        const emptyShops = shops?.filter(s => !shopsWithItems.has(s.id)) || [];

        if (emptyShops.length > 0) {
           newAlerts.push({
              type: "warning", title: `${emptyShops.length} Orphaned Shops Detected`,
              desc: "These shops registered but haven't added menu items.", link: "/admin/shops"
           });
        }

        // 2. Financial & Order Data
        const { data: orders } = await supabase.from("orders").select("total, status");
        let lifetimeGMV = 0, pendingGMV = 0, staleCount = 0, activeOrdersCount = 0;
        
        if (orders) {
           orders.forEach(o => {
              if (o.status.includes('paid') || o.status.includes('completed')) {
                 lifetimeGMV += Number(o.total || 0);
              } else if (o.status !== 'archived' && o.status !== 'cancelled') {
                 activeOrdersCount++;
                 pendingGMV += Number(o.total || 0);
                 if (['pending_payment', 'stk_pushed'].includes(o.status)) staleCount++;
              }
           });
        }
           
        if (staleCount > 0) {
           newAlerts.push({
               type: "error", title: `${staleCount} Pending/Stale Global Orders`,
               desc: "Orders stuck awaiting M-Pesa payment or WhatsApp verification.", link: "/admin/global-orders"
           });
        }

        // --- CRITICAL SECURITY TODOS ---
        newAlerts.push({
            type: "warning", title: "M-Pesa Webhook Vulnerable",
            desc: "ACTION REQUIRED: Add MPESA_WEBHOOK_SECRET to Supabase Edge Functions to prevent DDoS STK Spam.", link: "#"
        });

        newAlerts.push({
            type: "error", title: "Admin Account Hijack Risk",
            desc: "ACTION REQUIRED: Enable Mandatory MFA (2-Factor Authentication) in your Supabase Auth Settings immediately.", link: "#"
        });

        setMetrics({
           totalShops, premiumShops, orphanedShops: emptyShops.length,
           lifetimeGMV, pendingGMV, activeOrders: activeOrdersCount, staleOrders: staleCount,
           totalOrders: orders?.length || 0
        });
        setAlerts(newAlerts);
     } catch (err) {
        console.error("Failed to fetch admin metrics", err);
     } finally {
        setLoading(false);
     }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
          <button
             onClick={() => { logout(); navigate("/login"); }}
             className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
          >
             Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Top Level Macro Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-500 flex flex-col justify-between">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Platform GMV</p>
                {loading ? <div className="h-8 bg-gray-100 animate-pulse rounded w-1/2"></div> : (
                   <p className="text-3xl font-black text-gray-900 mt-2">KSh {metrics.lifetimeGMV.toLocaleString()}</p>
                )}
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-500 flex flex-col justify-between">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Shops</p>
                {loading ? <div className="h-8 bg-gray-100 animate-pulse rounded w-1/3"></div> : (
                   <div className="flex items-baseline gap-2 mt-2">
                       <p className="text-3xl font-black text-gray-900">{metrics.totalShops}</p>
                       <p className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{metrics.premiumShops} Premium</p>
                   </div>
                )}
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-amber-500 flex flex-col justify-between">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Volume</p>
                {loading ? <div className="h-8 bg-gray-100 animate-pulse rounded w-1/2"></div> : (
                   <div className="flex items-baseline gap-2 mt-2">
                       <p className="text-3xl font-black text-gray-900">KSh {metrics.pendingGMV.toLocaleString()}</p>
                       <p className="text-xs font-bold text-amber-600">{metrics.activeOrders} active</p>
                   </div>
                )}
            </div>
            <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-purple-500 flex flex-col justify-between">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Platform API Dispatches</p>
                {loading ? <div className="h-8 bg-gray-100 animate-pulse rounded w-1/3"></div> : (
                   <div className="flex items-baseline gap-2 mt-2">
                       <p className="text-3xl font-black text-gray-900">{(metrics.totalOrders * 1.5).toFixed(0)}</p>
                       <p className="text-xs font-bold text-purple-600">messages</p>
                   </div>
                )}
            </div>
        </div>

        {/* Admin Attention Widget */}
        <div className="mb-10">
           <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Attention Desk
           </h2>
           
           {loading ? (
              <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                 <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                 <div className="h-3 bg-gray-100 rounded w-1/2"></div>
              </div>
           ) : alerts.length === 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                 <span className="text-green-600 text-xl">✅</span>
                 <p className="text-green-800 font-medium text-sm">All systems nominal. No alerts.</p>
              </div>
           ) : (
              <div className="grid md:grid-cols-3 gap-3">
                 {alerts.map((alert, i) => (
                    <Link key={i} to={alert.link} className={`block rounded-xl p-4 border transition-all hover:-translate-y-0.5 shadow-sm hover:shadow active:scale-[0.99] ${
                       alert.type === 'error' ? 'bg-red-50 border-red-200' :
                       alert.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                       'bg-blue-50 border-blue-200'
                    }`}>
                       <div className="flex items-start gap-3">
                          <span className="text-xl mt-0.5">
                             {alert.type === 'error' ? '🚨' : alert.type === 'warning' ? '⚠️' : 'ℹ️'}
                          </span>
                          <div>
                             <h3 className={`font-bold text-sm ${
                                alert.type === 'error' ? 'text-red-900' :
                                alert.type === 'warning' ? 'text-amber-900' :
                                'text-blue-900'
                             }`}>{alert.title}</h3>
                             <p className={`text-xs mt-1 ${
                                alert.type === 'error' ? 'text-red-700' :
                                alert.type === 'warning' ? 'text-amber-700' :
                                'text-blue-700'
                             }`}>{alert.desc}</p>
                          </div>
                       </div>
                    </Link>
                 ))}
              </div>
           )}
        </div>

        <div className="grid xl:grid-cols-2 gap-8">
           
           {/* Section 1: Financial Directive */}
           <section className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                 <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-2xl">💰</div>
                 <div>
                    <h2 className="text-xl font-bold text-gray-900">Financial Directive</h2>
                    <p className="text-sm text-gray-500">Revenue, Margins, and Subscription Control.</p>
                 </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                 <Link to="/admin/analytics" className="p-4 rounded-xl border border-gray-100 hover:border-emerald-300 hover:bg-emerald-50 transition group">
                    <h3 className="font-bold text-gray-800 group-hover:text-emerald-800">📈 Macro Analytics & Margins</h3>
                    <p className="text-xs text-gray-500 mt-2">Deep-dive GMV graphs and API overhead costs modeling.</p>
                 </Link>
                 <Link to="/admin/payouts" className="p-4 rounded-xl border border-gray-100 hover:border-emerald-300 hover:bg-emerald-50 transition group">
                    <h3 className="font-bold text-gray-800 group-hover:text-emerald-800">🏦 Shop Payouts</h3>
                    <p className="text-xs text-gray-500 mt-2">Distribute funds, calculate platform splits, mark settled.</p>
                 </Link>
                 <Link to="/admin/plans" className="p-4 rounded-xl border border-gray-100 hover:border-emerald-300 hover:bg-emerald-50 transition sm:col-span-2 group">
                    <div className="flex justify-between items-center">
                       <div>
                          <h3 className="font-bold text-gray-800 group-hover:text-emerald-800">💳 Subscription Matrix</h3>
                          <p className="text-xs text-gray-500 mt-1">Configure MRR pricing boundaries, edit feature locks globally.</p>
                       </div>
                    </div>
                 </Link>
              </div>
           </section>

           {/* Section 2: Operations & Logistics */}
           <section className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                 <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center text-2xl">🌍</div>
                 <div>
                    <h2 className="text-xl font-bold text-gray-900">Global Operations</h2>
                    <p className="text-sm text-gray-500">Live order streams and cross-tenant catalogs.</p>
                 </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                 <Link to="/admin/global-orders" className="p-4 rounded-xl border border-gray-100 hover:border-amber-300 hover:bg-amber-50 transition group">
                    <div className="flex items-center justify-between">
                       <h3 className="font-bold text-gray-800 group-hover:text-amber-800">🌍 Order Stream</h3>
                       <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span></span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">God-mode live feed of every transaction on the platform.</p>
                 </Link>
                 <Link to="/admin/global-products" className="p-4 rounded-xl border border-gray-100 hover:border-amber-300 hover:bg-amber-50 transition group">
                    <h3 className="font-bold text-gray-800 group-hover:text-amber-800">📦 Catalog QA</h3>
                    <p className="text-xs text-gray-500 mt-2">Monitor all user-generated items for compliance/quality.</p>
                 </Link>
              </div>
           </section>

           {/* Section 3: Tenant Success (Growth) */}
           <section className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                 <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-2xl">🏪</div>
                 <div>
                    <h2 className="text-xl font-bold text-gray-900">Tenant Ecosystem</h2>
                    <p className="text-sm text-gray-500">Manage client environments and platform presence.</p>
                 </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                 <Link to="/admin/shops" className="p-4 rounded-xl border border-blue-500 bg-blue-50 shadow-sm hover:shadow transition group sm:col-span-2 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-200/50 rounded-bl-full z-0 transition-transform group-hover:scale-125"></div>
                    <h3 className="font-bold text-blue-900 relative z-10 flex items-center gap-2">🚀 Space Launcher & Ecosystem</h3>
                    <p className="text-xs text-blue-800/80 mt-2 max-w-[80%] relative z-10">Deploy parallel shop environments, handle manual upgrades, and monitor the active registry.</p>
                 </Link>
                 <Link to="/admin/seo" className="p-4 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition group">
                    <h3 className="font-bold text-gray-800 group-hover:text-blue-800">🔍 Search Engine (SEO)</h3>
                    <p className="text-xs text-gray-500 mt-2">Google JSON-LD listing optimizations.</p>
                 </Link>
                 <Link to="/admin/booklet" className="p-4 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-blue-50 transition group">
                    <h3 className="font-bold text-gray-800 group-hover:text-blue-800">📖 Sales Booklet</h3>
                    <p className="text-xs text-gray-500 mt-2">Client onboarding and feature explanations.</p>
                 </Link>
              </div>
           </section>

           {/* Section 4: Engineering & Architecture */}
           <section className="bg-gray-900 rounded-3xl p-8 shadow-xl border border-gray-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full pointer-events-none"></div>
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-800">
                 <div className="w-12 h-12 bg-indigo-900/50 text-indigo-400 rounded-xl border border-indigo-700/50 flex items-center justify-center text-2xl">⚙️</div>
                 <div>
                    <h2 className="text-xl font-bold text-white">Platform Engineering</h2>
                    <p className="text-sm text-gray-400">Low-level overrides, system telemetry, schemas.</p>
                 </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 relative z-10">
                 <Link to="/admin/engineering" className="p-4 bg-black/40 rounded-xl border border-gray-800 hover:border-indigo-500/50 hover:bg-black/60 transition group font-mono">
                    <h3 className="font-bold text-indigo-400 group-hover:text-indigo-300 text-sm">God-Mode Access</h3>
                    <p className="text-[10px] text-gray-500 mt-2">Simulate environments and trigger structural hooks.</p>
                 </Link>
                 <Link to="/admin/monitoring" className="p-4 bg-black/40 rounded-xl border border-gray-800 hover:border-indigo-500/50 hover:bg-black/60 transition group font-mono">
                    <h3 className="font-bold text-red-400 group-hover:text-red-300 text-sm flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                      Live Packets
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-2">Raw API telemetry, webhook status, memory sensors.</p>
                 </Link>
                 
                 <div className="sm:col-span-2 grid grid-cols-3 gap-2 mt-2">
                    <a href="/system_architecture.md" download="V3_Architecture.md" className="p-2 bg-gray-800 rounded text-center hover:bg-gray-700 transition">
                       <p className="text-xs text-gray-300 font-bold">📚 Arch Specs</p>
                    </a>
                    <a href="/super_manager_guide.md" download="V3_SuperAdmin.md" className="p-2 bg-gray-800 rounded text-center hover:bg-gray-700 transition">
                       <p className="text-xs text-gray-300 font-bold">👑 Admin Rules</p>
                    </a>
                    <Link to="/admin/report" className="p-2 bg-indigo-900/50 text-indigo-200 border border-indigo-700/50 rounded text-center hover:bg-indigo-900 transition">
                       <p className="text-xs font-bold">📊 Cohesion Repo</p>
                    </Link>
                 </div>
              </div>
           </section>

        </div>
      </main>
    </div>
  );
}
