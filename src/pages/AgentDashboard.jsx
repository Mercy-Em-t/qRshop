import { useState, useEffect } from "react";
import { supabase } from "../services/supabase-client";
import { Link } from "react-router-dom";

export default function AgentDashboard() {
  const [agent, setAgent] = useState(null);
  const [shops, setShops] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("shops");

  useEffect(() => {
    fetchAgentData();
  }, []);

  const fetchAgentData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: agentData } = await supabase
      .from("agents")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (agentData) {
      setAgent(agentData);
      const { data: shopsData } = await supabase
        .from("shops")
        .select("*, id:shop_id")
        .eq("agent_id", agentData.id);
      setShops(shopsData || []);

      const { data: reportsData } = await supabase
        .from("shop_reports")
        .select("*, shops(name)")
        .eq("agent_id", agentData.id)
        .eq("status", "pending");
      setReports(reportsData || []);
    }
    setLoading(false);
  };

  const updateShopTier = async (shopId, level) => {
    const { error } = await supabase
      .from("shops")
      .update({ verification_level: level })
      .eq("shop_id", shopId);
    if (!error) fetchAgentData();
  };

  const togglePaymentMode = async (shopId, currentMode, currentTier) => {
    if (currentTier !== 'gold' && currentMode === 'escrow') {
        alert("Only Gold-tier merchants are eligible for Direct-to-Shop payments to ensure consumer safety.");
        return;
    }
    const newMode = currentMode === 'escrow' ? 'direct' : 'escrow';
    const { error } = await supabase
      .from("shops")
      .update({ payment_mode: newMode })
      .eq("shop_id", shopId);
    if (!error) fetchAgentData();
  };

  const resolveReport = async (reportId, status) => {
    const { error } = await supabase
      .from("shop_reports")
      .update({ status: status })
      .eq("id", reportId);
    if (!error) fetchAgentData();
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!agent) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
       <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm">
          <span className="text-4xl mb-4 block">🚫</span>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-500 mb-6 font-medium">You are not registered as an official Regional Agent.</p>
          <Link to="/" className="text-indigo-600 font-bold">Return Home</Link>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar (Same as before) */}
      <aside className="w-full md:w-64 bg-slate-900 text-white p-6 flex flex-col h-auto md:h-screen sticky top-0">
          <div className="mb-10">
             <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                <span className="text-indigo-400">🛡️</span> Agent Hub
             </h2>
             <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">{agent.jurisdiction_name}</p>
          </div>
          <nav className="flex-1 space-y-2">
             <button onClick={() => setActiveTab("shops")} className={`w-full text-left px-4 py-3 rounded-xl transition font-bold ${activeTab === 'shops' ? 'bg-indigo-600' : 'text-slate-400 hover:bg-slate-800'}`}>My Merchants</button>
             <button onClick={() => setActiveTab("reports")} className={`w-full text-left px-4 py-3 rounded-xl transition font-bold flex justify-between items-center ${activeTab === 'reports' ? 'bg-indigo-600' : 'text-slate-400 hover:bg-slate-800'}`}>
                Reports {reports.length > 0 && <span className="bg-red-500 text-[10px] px-2 py-0.5 rounded-full">{reports.length}</span>}
             </button>
          </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10">
          {activeTab === "shops" ? (
             <div>
                <header className="mb-10 flex justify-between items-end">
                   <div>
                      <h1 className="text-3xl font-black text-slate-900 mb-1">Assigned Shops</h1>
                      <p className="text-slate-500 font-medium">Manage verification and payment routing for {agent.jurisdiction_name}.</p>
                   </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {shops.map(shop => (
                      <div key={shop.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                         <div className="flex justify-between items-start mb-4">
                            <div>
                               <h3 className="font-bold text-slate-900 text-lg leading-tight">{shop.name}</h3>
                               <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-tight">{shop.industry_type}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                               shop.verification_level === 'gold' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100'
                            }`}>{shop.verification_level}</span>
                         </div>

                         <div className="bg-slate-50 rounded-2xl p-4 mb-6 space-y-3">
                            <div className="flex justify-between items-center text-xs">
                               <span className="text-slate-400 uppercase font-black tracking-widest">Payment Mode</span>
                               <span className={`font-black uppercase px-2 py-0.5 rounded ${shop.payment_mode === 'escrow' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}`}>
                                  {shop.payment_mode}
                               </span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                               <span className="text-slate-400 uppercase font-black tracking-widest">Trust Index</span>
                               <span className="font-bold text-slate-900">★ {shop.trust_score}</span>
                            </div>
                         </div>

                         <div className="grid grid-cols-1 gap-2">
                            <button 
                               onClick={() => togglePaymentMode(shop.id, shop.payment_mode, shop.verification_level)}
                               className="text-xs font-black bg-slate-900 text-white py-3 rounded-xl hover:bg-slate-800 transition shadow-lg shadow-slate-100"
                            >
                               {shop.payment_mode === 'escrow' ? 'Switch to Direct Checkout' : 'Force Escrow Shield'}
                            </button>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                               <button onClick={() => updateShopTier(shop.id, 'silver')} className="text-[10px] font-bold bg-slate-100 text-slate-600 py-2 rounded-lg">Silver Status</button>
                               <button onClick={() => updateShopTier(shop.id, 'gold')} className="text-[10px] font-bold bg-yellow-50 text-yellow-700 py-2 rounded-lg">Gold Status</button>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          ) : (
             <div className="max-w-4xl">
                <h1 className="text-3xl font-black text-slate-900 mb-6">Pending Investigations</h1>
                <div className="space-y-4">
                   {reports.map(report => (
                      <div key={report.id} className="bg-white rounded-3xl p-6 border border-slate-100 flex items-center justify-between gap-6">
                         <div className="flex-1">
                            <h4 className="font-bold text-slate-900">{report.shops?.name}</h4>
                            <p className="text-xs font-black text-red-500 uppercase tracking-widest mt-1">{report.category.replace('_', ' ')}</p>
                            <p className="text-sm text-slate-500 mt-2 italic">"{report.description}"</p>
                         </div>
                         <button onClick={() => resolveReport(report.id, 'investigating')} className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-indigo-100">Investigate</button>
                      </div>
                   ))}
                </div>
             </div>
          )}
      </main>
    </div>
  );
}
