import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { getCurrentUser, logout } from "../services/auth-service";

export default function AdminShops() {
  const [shops, setShops] = useState([]);
  const [upgradeRequests, setUpgradeRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newShopName, setNewShopName] = useState("");
  const [newShopSubdomain, setNewShopSubdomain] = useState("");
  const [newShopPhone, setNewShopPhone] = useState("");
  const [newShopWhatsApp, setNewShopWhatsApp] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newShopIndustry, setNewShopIndustry] = useState("food");
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  const user = getCurrentUser();

  useEffect(() => {
    if (!user || user.role !== "system_admin") {
      navigate("/login");
      return;
    }
    fetchShops();
  }, [navigate]);

  const fetchShops = async () => {
    setLoading(true);
    // Fetch all shops and their owner credentials
    const { data: shopsData, error: shopsErr } = await supabase
      .from("shops")
      .select(`
        *,
        shop_users (email, role)
      `)
      .order("created_at", { ascending: false });

    if (!shopsErr && shopsData) {
      setShops(shopsData);
    }

    // Fetch pending upgrades requests
    const { data: reqData, error: reqErr } = await supabase
      .from("upgrade_requests")
      .select(`
         *,
         shops (name)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
      
    if (!reqErr && reqData) {
       setUpgradeRequests(reqData);
    }

    setLoading(false);
  };

  const exportToCSV = () => {
    if (!shops || shops.length === 0) return;
    
    const headers = ["Shop ID", "Shop Name", "Subdomain", "Industry", "Subscription Plan", "Phone", "Admin Emails", "Registration Date"];
    
    const rows = shops.map(s => {
      const adminList = s.shop_users?.map(u => u.email).join("; ") || "No Admin";
      return [
        s.id,
        s.name,
        s.subdomain || "",
        s.industry_type || "food",
        s.plan,
        s.phone || "",
        adminList,
        new Date(s.created_at).toLocaleString()
      ];
    });
    
    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ShopQR_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProcessUpgrade = async (requestId, targetShopId, approved) => {
     try {
        if (approved) {
           // update shop to pro
           const { error: shopErr } = await supabase.from("shops").update({ plan: "pro" }).eq("id", targetShopId);
           if (shopErr) throw shopErr;
        }
        // update request status
        const { error: reqErr } = await supabase.from("upgrade_requests").update({ status: approved ? "approved" : "rejected" }).eq("id", requestId);
        if (reqErr) throw reqErr;
        
        alert(`Request ${approved ? 'Approved' : 'Rejected'} successfully.`);
        fetchShops(); // reload everything
     } catch (err) {
        alert("Failed to process request: " + err.message);
     }
  };

  const handleSetPlan = async (shopId, newPlan) => {
    if (!window.confirm(`Are you sure you want to change this shop's plan to ${newPlan.toUpperCase()}?`)) return;

    try {
       const { error } = await supabase.from('shops').update({ plan: newPlan }).eq('id', shopId);
       if (error) throw error;
       
       alert(`Shop plan successfully updated to ${newPlan.toUpperCase()}`);
       fetchShops(); // Refresh the list
    } catch (err) {
       alert("Failed to update plan: " + err.message);
    }
  };

  const handleCreateShop = async (e) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      // 1. Create the physical Shop space
      // Try with advanced fields first
      const fullShopData = {
         name: newShopName, 
         subdomain: newShopSubdomain ? newShopSubdomain.toLowerCase().replace(/[^a-z0-9-]/g, "") : null,
         phone: newShopPhone, 
         whatsapp_number: newShopWhatsApp || newShopPhone, 
         plan: "free",
         industry_type: newShopIndustry
      };

      let newShop;
      let shopErr;

      const res = await supabase.from("shops").insert([fullShopData]).select().single();
      
      if (res.error) {
         console.warn("Full insert failed, falling back to core columns...", res.error);
         const basicData = { name: newShopName, phone: newShopPhone, plan: "free" };
         const fallbackRes = await supabase.from("shops").insert([basicData]).select().single();
         if (fallbackRes.error) throw fallbackRes.error;
         newShop = fallbackRes.data;
         alert("Warning: Core shop created, but advanced options (Subdomain, Industry, WhatsApp) were omitted because the Database schema is not fully updated. Please run all Phase 10-25 SQL scripts.");
      } else {
         newShop = res.data;
      }

      // 2. Create the associated Admin User for that Shop space
      // Auto-generate a secure random 8-character password
      const genPassword = Math.random().toString(36).substring(2, 10);

      const { error: userErr } = await supabase
        .from("shop_users")
        .insert([{
           email: newAdminEmail,
           password: genPassword,
           role: "shop_owner",
           shop_id: newShop.id
        }]);
      
      if (userErr) throw userErr;

      setNewShopName("");
      setNewShopSubdomain("");
      setNewShopPhone("");
      setNewShopWhatsApp("");
      setNewShopIndustry("food");
      setNewAdminEmail("");
      
      alert(`✅ Success! Parallel Shop Space Deployed.\n\nShop Owner Platform Credentials:\nEmail: ${newAdminEmail}\nPassword: ${genPassword}\n\nPlease copy and email this password securely to the user.`);
      fetchShops();
    } catch (err) {
      alert("Deployment failed. Have you run the Multi-Tenant SQL Migration script? Error: " + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/admin"
            className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
          >
            ← System Admin
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Global Infrastructure</h1>
          <div className="flex items-center">
             <button
               onClick={() => { logout(); navigate("/login"); }}
               className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
             >
               Logout
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-[3fr_2fr] gap-8">
        
        {/* Network Operations Center */}
        <div className="flex flex-col gap-8">

           {/* Upgrade Requests Inbox */}
           {upgradeRequests.length > 0 && (
              <section className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                 <h2 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                    </span>
                    Action Required: Upgrade Requests
                 </h2>
                 <div className="space-y-3">
                    {upgradeRequests.map(req => (
                       <div key={req.id} className="bg-white rounded-lg p-4 shadow-sm border border-orange-100 flex justify-between items-center">
                          <div>
                             <p className="font-bold text-gray-800">{req.shops?.name}</p>
                             <p className="text-xs text-gray-500 mt-0.5">Requested {req.requested_tier.toUpperCase()} tier on {new Date(req.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => handleProcessUpgrade(req.id, req.shop_id, false)} className="px-3 py-1.5 bg-red-50 text-red-600 font-bold text-xs rounded-md hover:bg-red-100 transition cursor-pointer">Reject</button>
                             <button onClick={() => handleProcessUpgrade(req.id, req.shop_id, true)} className="px-3 py-1.5 bg-green-500 text-white font-bold text-xs rounded-md hover:bg-green-600 transition shadow-sm cursor-pointer">Approve</button>
                          </div>
                       </div>
                    ))}
                 </div>
              </section>
           )}

           <section>
              <div className="flex items-center justify-between mb-4">
                 <h2 className="text-lg font-bold text-gray-800">Active Shop Ecosystem</h2>
                 <button onClick={exportToCSV} disabled={loading || shops.length === 0} className="text-xs bg-green-50 hover:bg-green-100 text-green-700 font-bold px-3 py-1.5 rounded-lg border border-green-200 transition flex items-center gap-2 cursor-pointer disabled:opacity-50">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    Export Registry (CSV)
                 </button>
              </div>
          
          {loading ? (
             <p className="text-gray-500 py-4">Polling regional nodes...</p>
          ) : shops.length === 0 ? (
             <p className="text-gray-500 py-4">No parallel shop spaces active.</p>
          ) : (
             <div className="space-y-4">
               {shops.map((shop) => (
                 <div key={shop.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3">
                   <div className="flex justify-between items-start">
                      <div>
                         <h3 className="text-lg font-bold text-gray-900">{shop.name}</h3>
                         <span className="font-mono text-xs text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded">{shop.id}</span>
                         <span className="ml-1 font-mono text-xs text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded capitalize">{shop.industry_type || "Food"}</span>
                         {shop.subdomain && (
                            <span className="ml-2 font-bold text-xs text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded">
                               {shop.subdomain}.tmsavannah.com
                            </span>
                         )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                         <span className={`${['pro', 'business'].includes(shop.plan) ? 'bg-indigo-100 text-indigo-800' : shop.plan === 'basic' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} font-bold px-2 py-1 rounded-full text-xs uppercase`}>
                            {shop.plan} Plan
                         </span>
                         <select 
                            value={shop.plan || 'free'}
                            onChange={(e) => handleSetPlan(shop.id, e.target.value)}
                            className="mt-1 text-[10px] font-bold text-indigo-700 bg-white border border-gray-200 rounded px-1 py-0.5 outline-none cursor-pointer hover:border-indigo-400"
                         >
                            <option value="free">Set: FREE</option>
                            <option value="basic">Set: BASIC</option>
                            <option value="pro">Set: PRO</option>
                            <option value="business">Set: BUSINESS</option>
                         </select>
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                      <span>📞 {shop.phone || "No phone"}</span>
                   </div>

                   <div className="bg-gray-50 rounded-lg p-3 text-sm mt-2 border border-blue-50">
                      <p className="font-bold text-gray-800 mb-1">Administrative Seats:</p>
                      {shop.shop_users?.map((su, idx) => (
                         <div key={idx} className="flex items-center justify-between text-gray-600">
                           <span>{su.email}</span>
                           <span className="bg-blue-100 text-blue-800 font-semibold px-2 rounded-full text-[10px] uppercase">
                             {su.role}
                           </span>
                         </div>
                      ))}
                      {(!shop.shop_users || shop.shop_users.length === 0) && (
                         <span className="text-red-500">Unclaimed / No login bound</span>
                      )}
                   </div>
                 </div>
               ))}
             </div>
          )}
        </section>
      </div>

      {/* Space Launcher */}
        <section>
           <div className="bg-indigo-600 text-white rounded-xl shadow-lg p-6 sticky top-24">
             <h2 className="text-xl font-bold mb-2">Launch Sandbox</h2>
             <p className="text-indigo-200 text-sm mb-6">Instantly provision and boot a completely isolated, scalable backend environment for a new client.</p>

             <form onSubmit={handleCreateShop} className="space-y-4">
               <div>
                  <label className="block text-sm font-semibold mb-1 text-indigo-100">Shop Entity Name</label>
                  <input
                    required
                    type="text"
                    value={newShopName}
                    onChange={(e) => setNewShopName(e.target.value)}
                    placeholder="e.g. The Rustic Burger"
                    className="w-full bg-indigo-700/50 border border-indigo-400 rounded-lg px-3 py-2 text-white placeholder-indigo-300 outline-none focus:ring-2 focus:ring-white transition"
                  />
               </div>
               <div>
                  <label className="block text-sm font-semibold mb-1 text-indigo-100">Subdomain Handle (Optional)</label>
                  <input
                    type="text"
                    value={newShopSubdomain}
                    onChange={(e) => setNewShopSubdomain(e.target.value)}
                    placeholder="e.g. rusticburger"
                    className="w-full bg-indigo-700/50 border border-indigo-400 rounded-lg px-3 py-2 text-white placeholder-indigo-300 outline-none focus:ring-2 focus:ring-white transition font-mono text-sm"
                  />
               </div>
               <div>
                  <label className="block text-sm font-semibold mb-1 text-indigo-100">Contact Gateway (Phone)</label>
                  <input
                    required
                    type="tel"
                    value={newShopPhone}
                    onChange={(e) => setNewShopPhone(e.target.value)}
                    placeholder="e.g. 254700000000"
                    className="w-full bg-indigo-700/50 border border-indigo-400 rounded-lg px-3 py-2 text-white placeholder-indigo-300 outline-none focus:ring-2 focus:ring-white transition"
                  />
               </div>
               <div>
                  <label className="block text-sm font-semibold mb-1 text-green-300 flex items-center gap-1">
                     <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                     WhatsApp Gateway
                  </label>
                  <input
                    type="tel"
                    value={newShopWhatsApp}
                    onChange={(e) => setNewShopWhatsApp(e.target.value)}
                    placeholder="e.g. 254700000000"
                    className="w-full bg-green-900/40 border border-green-500/50 rounded-lg px-3 py-2 text-white placeholder-green-200/50 outline-none focus:ring-2 focus:ring-green-400 transition"
                  />
                  <p className="text-[10px] text-indigo-300 mt-1">If blank, standard Gateway is targeted.</p>
               </div>
               <div className="border-t border-indigo-400/50 my-2 pt-4">
                  <label className="block text-sm font-semibold mb-1 text-indigo-100">Industry Profile</label>
                  <select
                     value={newShopIndustry}
                     onChange={(e) => setNewShopIndustry(e.target.value)}
                     className="w-full bg-indigo-700/50 border border-indigo-400 rounded-lg px-3 py-2 text-white outline-none focus:ring-2 focus:ring-white transition mb-4"
                  >
                     <option value="food">Food & Beverage (Restaurant, Cafe)</option>
                     <option value="retail">Retail & Stores (Boutique, Convenience)</option>
                     <option value="service">Services (Salon, Spa, Clinic)</option>
                     <option value="other">Other</option>
                  </select>
                  
                  <label className="block text-sm font-semibold mb-1 text-indigo-100">Owner Login Email</label>
                  <input
                    required
                    type="email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    placeholder="owner@rustic.com"
                    className="w-full bg-indigo-700/50 border border-indigo-400 rounded-lg px-3 py-2 text-white placeholder-indigo-300 outline-none focus:ring-2 focus:ring-white transition"
                  />
               </div>
               
               <button
                 type="submit"
                 disabled={isCreating}
                 className="w-full mt-2 bg-white text-indigo-800 font-bold py-3 rounded-lg hover:bg-indigo-50 transition cursor-pointer disabled:opacity-50"
               >
                 {isCreating ? "Provisioning..." : "⚡ Boot Environment"}
               </button>
             </form>
           </div>
        </section>
      </main>
    </div>
  );
}
