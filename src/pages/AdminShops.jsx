import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { getCurrentUser, logout } from "../services/auth-service";

export default function AdminShops() {
  const [shops, setShops] = useState([]);
  const [upgradeRequests, setUpgradeRequests] = useState([]);
  const [kycRequests, setKycRequests] = useState([]);
  const [marketplacePending, setMarketplacePending] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newShopName, setNewShopName] = useState("");
  const [newShopSubdomain, setNewShopSubdomain] = useState("");
  const [newShopPhone, setNewShopPhone] = useState("");
  const [newShopWhatsApp, setNewShopWhatsApp] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newShopIndustry, setNewShopIndustry] = useState("");
  const [industryTypes, setIndustryTypes] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [activeLauncherTab, setActiveLauncherTab] = useState("shop");

  // Community State
  const [newCommunityName, setNewCommunityName] = useState("");
  const [newCommunitySlug, setNewCommunitySlug] = useState("");
  const [newCommunityDesc, setNewCommunityDesc] = useState("");

  // Supplier State
  const [newSupName, setNewSupName] = useState("");
  const [newSupIndustry, setNewSupIndustry] = useState("retail");
  const [newSupPhone, setNewSupPhone] = useState("");
  const [newSupMpesa, setNewSupMpesa] = useState("");
  const [newSupPasskey, setNewSupPasskey] = useState("");

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

    // Fetch pending KYC requests
    const { data: kycData, error: kycErr } = await supabase
      .from("shop_kyc")
      .select(`
         *,
         shops (name)
      `)
      .eq("verification_status", "pending")
      .order("submitted_at", { ascending: false });
      
    if (!kycErr && kycData) {
       setKycRequests(kycData);
    }
    
    // Fetch mapped global taxonomies
    const { data: indData } = await supabase
      .from("industry_types")
      .select("*")
      .order("created_at", { ascending: true });
      
    if (indData) {
       setIndustryTypes(indData);
       if (indData.length > 0 && !newShopIndustry) setNewShopIndustry(indData[0].slug);
    }

    // Fetch shops awaiting marketplace approval
    const { data: mktData } = await supabase
      .from('shops')
      .select('id, name, subdomain, industry_type, plan, created_at, shop_users(email)')
      .eq('marketplace_status', 'pending_review')
      .order('created_at', { ascending: false });
    if (mktData) setMarketplacePending(mktData);

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

  const handleProcessKYC = async (kycId, approved) => {
     try {
        const newStatus = approved ? "tier3" : "rejected";
        const { error: reqErr } = await supabase.from("shop_kyc").update({ verification_status: newStatus }).eq("id", kycId);
        if (reqErr) throw reqErr;
        
        alert(`KYC Profile marked as ${newStatus.toUpperCase()}`);
        fetchShops(); // reload everything
     } catch (err) {
        alert("Failed to process KYC: " + err.message);
     }
  };

  const handleMarketplaceApproval = async (shopId, action) => {
    // action: 'approved' | 'rejected' | 'suspended'
    try {
      const { error } = await supabase.from('shops')
        .update({ marketplace_status: action })
        .eq('id', shopId);
      if (error) throw error;
      alert(`Marketplace status set to ${action.toUpperCase()}`);
      fetchShops();
    } catch (err) {
      alert('Failed to update marketplace status: ' + err.message);
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
      // Fetch session token for secure provisioning
      let adminToken = "mock-admin-token-for-admin@qrshop.com";
      const { data: authData } = await supabase.auth.getSession();
      if (authData?.session?.access_token) {
         adminToken = authData.session.access_token;
      }

      // Delegate pure SQL queries to the Backend Vercel Gateway to isolate keys and enable Native Emails
      const response = await fetch("/api/admin/create-shop", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            adminToken,
            shopName: newShopName,
            subdomain: newShopSubdomain,
            phone: newShopPhone,
            whatsapp: newShopWhatsApp,
            industry: newShopIndustry,
            ownerEmail: newAdminEmail
         })
      });

      if (response.headers.get("content-type")?.includes("text/html")) {
          throw new Error("API Route not found. Ensure you are running the app with 'vercel dev' instead of 'npm run dev'.");
      }

      const resData = await response.json();
      
      if (!response.ok || !resData.success) {
         throw new Error(resData.error || "Deployment execution aborted by security gateway.");
      }

      setNewShopName("");
      setNewShopSubdomain("");
      setNewShopPhone("");
      setNewShopWhatsApp("");
      if (industryTypes.length > 0) setNewShopIndustry(industryTypes[0].slug);
      setNewAdminEmail("");
      
      alert(`✅ Success! Sandbox Space Deployed.\n\nAn official setup email has been dispatched via Supabase to:\n${newAdminEmail}\n\nThe user can now click the link inside their email to securely construct their password and dock with the platform.`);
      fetchShops();
    } catch (err) {
      alert("Deployment failed. Error: " + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const { error } = await supabase.from('communities').insert([{
        name: newCommunityName,
        slug: newCommunitySlug || newCommunityName.toLowerCase().replace(/ /g, '-'),
        description: newCommunityDesc
      }]);
      if (error) throw error;
      alert("✅ Community Launched!");
      setNewCommunityName("");
      setNewCommunitySlug("");
      setNewCommunityDesc("");
      fetchShops();
    } catch (err) {
      alert("Creation failed: " + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const { error } = await supabase.from('suppliers').insert([{
        name: newSupName,
        industry: newSupIndustry,
        contact_phone: newSupPhone,
        mpesa_shortcode: newSupMpesa,
        mpesa_passkey: newSupPasskey,
        is_verified: true // Admin-launched suppliers are auto-verified
      }]);
      if (error) throw error;
      alert("✅ Supplier Provisioned!");
      setNewSupName("");
      setNewSupPhone("");
      setNewSupMpesa("");
      setNewSupPasskey("");
      fetchShops();
    } catch (err) {
      alert("Provisioning failed: " + err.message);
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

           {/* KYC Verification Inbox */}
           {kycRequests.length > 0 && (
              <section className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                 <h2 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                    </span>
                    Compliance Required: KYC Profiles
                 </h2>
                 <div className="space-y-3">
                    {kycRequests.map(req => (
                       <div key={req.id} className="bg-white rounded-lg p-4 shadow-sm border border-blue-100 flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                             <div>
                                <p className="font-bold text-gray-800 uppercase">{req.legal_business_name} <span className="text-xs text-gray-500 font-normal normal-case">({req.shops?.name})</span></p>
                                <div className="text-xs text-gray-600 mt-2 space-y-1">
                                   <p>🏢 <span className="font-bold">Structure:</span> {req.business_type} | <span className="font-bold">Loc:</span> {req.county_city} | <span className="font-bold">Type:</span> {req.store_type}</p>
                                   <p>🧾 <span className="font-bold">KRA PIN:</span> <span className="font-mono bg-gray-100 px-1">{req.kra_pin}</span> | <span className="font-bold">Reg No:</span> <span className="font-mono bg-gray-100 px-1">{req.business_reg_number || 'N/A'}</span></p>
                                   <p>👤 <span className="font-bold">Owner:</span> {req.owner_full_name} | <span className="font-bold">ID:</span> {req.owner_national_id} | <span className="font-bold">Tel:</span> {req.owner_phone}</p>
                                   <p>💸 <span className="font-bold">M-Pesa Payout:</span> {req.mpesa_phone} ({req.mpesa_account_name})</p>
                                </div>
                             </div>
                             <div className="flex gap-2">
                                <button onClick={() => handleProcessKYC(req.id, false)} className="px-3 py-1.5 bg-red-50 text-red-600 font-bold text-xs rounded-md hover:bg-red-100 transition cursor-pointer">Reject</button>
                                <button onClick={() => handleProcessKYC(req.id, true)} className="px-3 py-1.5 bg-green-500 text-white font-bold text-xs rounded-md hover:bg-green-600 transition shadow-sm cursor-pointer">Approve</button>
                             </div>
                          </div>
                          <div className="flex gap-4 pt-3 border-t border-gray-100 text-xs">
                             {req.director_id_url && <a href={req.director_id_url} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline border border-blue-100 bg-blue-50 px-2 py-1 rounded">📄 View Director ID</a>}
                             {req.business_permit_url && <a href={req.business_permit_url} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline border border-blue-100 bg-blue-50 px-2 py-1 rounded">📄 View Business Reg</a>}
                             {req.kra_cert_url && <a href={req.kra_cert_url} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline border border-blue-100 bg-blue-50 px-2 py-1 rounded">📄 View KRA Cert</a>}
                          </div>
                       </div>
                    ))}
                 </div>
              </section>
           )}

           {/* Marketplace Approval Inbox */}
           {marketplacePending.length > 0 && (
              <section className="bg-teal-50 rounded-xl p-6 border border-teal-200">
                 <h2 className="text-lg font-bold text-teal-800 mb-1 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
                    </span>
                    Marketplace Discovery Requests
                 </h2>
                 <p className="text-xs text-teal-600 mb-4">Approve shops to publish their products on the public Discover page.</p>
                 <div className="space-y-3">
                    {marketplacePending.map(shop => (
                       <div key={shop.id} className="bg-white rounded-lg p-4 shadow-sm border border-teal-100">
                          <div className="flex justify-between items-start">
                             <div>
                                <p className="font-bold text-gray-800">{shop.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                   {shop.industry_type?.toUpperCase()} · {shop.plan?.toUpperCase()} ·{' '}
                                   {shop.shop_users?.map(u => u.email).join(', ')}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">Requested {new Date(shop.created_at).toLocaleDateString()}</p>
                             </div>
                             <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-bold">Pending</span>
                          </div>
                          <div className="flex gap-2 mt-3">
                             <button
                                onClick={() => handleMarketplaceApproval(shop.id, 'rejected')}
                                className="flex-1 px-3 py-2 bg-red-50 text-red-600 font-bold text-xs rounded-lg hover:bg-red-100 transition"
                             >
                                ✕ Reject
                             </button>
                             <button
                                onClick={() => handleMarketplaceApproval(shop.id, 'approved')}
                                className="flex-1 px-3 py-2 bg-teal-500 text-white font-bold text-xs rounded-lg hover:bg-teal-600 transition shadow-sm"
                             >
                                ✓ Approve & Publish
                             </button>
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

      {/* Ecosystem Launcher Sidebar */}
        <section>
           <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden sticky top-24">
             {/* Tab Switcher */}
             <div className="flex border-b border-gray-100 bg-gray-50/50">
               {['shop', 'community', 'supplier'].map(tab => (
                 <button
                    key={tab}
                    onClick={() => setActiveLauncherTab(tab)}
                    className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeLauncherTab === tab 
                        ? 'bg-white text-indigo-600 border-b-2 border-indigo-600 shadow-sm' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                 >
                   {tab}
                 </button>
               ))}
             </div>

             <div className="p-6">
                {activeLauncherTab === 'shop' && (
                  <>
                    <h2 className="text-xl font-black text-gray-900 mb-1">Launch Shop</h2>
                    <p className="text-gray-500 text-xs mb-6">Provision an isolated commerce environment.</p>

                    <form onSubmit={handleCreateShop} className="space-y-4">
                      <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Entity Name</label>
                          <input
                            required
                            type="text"
                            value={newShopName}
                            onChange={(e) => setNewShopName(e.target.value)}
                            placeholder="e.g. The Rustic Burger"
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-400 rounded-xl px-4 py-3 outline-none transition text-sm"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Subdomain</label>
                          <input
                            type="text"
                            value={newShopSubdomain}
                            onChange={(e) => setNewShopSubdomain(e.target.value)}
                            placeholder="rustic"
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-400 rounded-xl px-4 py-3 outline-none transition text-sm font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Industry</label>
                          <select
                             value={newShopIndustry}
                             onChange={(e) => setNewShopIndustry(e.target.value)}
                             className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-400 rounded-xl px-4 py-3 outline-none transition text-sm"
                          >
                             {industryTypes.map(ind => (
                                <option key={ind.slug} value={ind.slug}>{ind.name}</option>
                             ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Phone</label>
                          <input
                            required
                            type="tel"
                            value={newShopPhone}
                            onChange={(e) => setNewShopPhone(e.target.value)}
                            placeholder="254..."
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-400 rounded-xl px-4 py-3 outline-none transition text-sm"
                          />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Owner Email</label>
                           <input
                             required
                             type="email"
                             value={newAdminEmail}
                             onChange={(e) => setNewAdminEmail(e.target.value)}
                             placeholder="owner@shop.com"
                             className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-400 rounded-xl px-4 py-3 outline-none transition text-sm"
                           />
                        </div>
                      </div>
                      
                      <button
                        type="submit"
                        disabled={isCreating}
                        className="w-full mt-2 bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 disabled:opacity-50"
                      >
                        {isCreating ? "Provisioning..." : "⚡ Boot Environment"}
                      </button>
                    </form>
                  </>
                )}

                {activeLauncherTab === 'community' && (
                  <>
                    <h2 className="text-xl font-black text-gray-900 mb-1">Build Community</h2>
                    <p className="text-gray-500 text-xs mb-6">Create a new hub for marketplace discovery.</p>

                    <form onSubmit={handleCreateCommunity} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Community Name</label>
                        <input
                          required
                          type="text"
                          value={newCommunityName}
                          onChange={(e) => setNewCommunityName(e.target.value)}
                          placeholder="e.g. Garden Lovers"
                          className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-400 rounded-xl px-4 py-3 outline-none transition text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Slug (Link)</label>
                        <input
                          type="text"
                          value={newCommunitySlug}
                          onChange={(e) => setNewCommunitySlug(e.target.value)}
                          placeholder="garden-lovers"
                          className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-400 rounded-xl px-4 py-3 outline-none transition text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Description</label>
                        <textarea
                          rows="3"
                          value={newCommunityDesc}
                          onChange={(e) => setNewCommunityDesc(e.target.value)}
                          className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-400 rounded-xl px-4 py-3 outline-none transition text-sm"
                        ></textarea>
                      </div>
                      <button
                        type="submit"
                        disabled={isCreating}
                        className="w-full bg-teal-600 text-white font-black py-4 rounded-2xl hover:bg-teal-700 transition shadow-lg shadow-teal-100 disabled:opacity-50"
                      >
                        {isCreating ? "Initializing..." : "🌱 Sprout Community"}
                      </button>
                    </form>
                  </>
                )}

                {activeLauncherTab === 'supplier' && (
                  <>
                    <h2 className="text-xl font-black text-gray-900 mb-1">Onboard Supplier</h2>
                    <p className="text-gray-500 text-xs mb-6">Register a verified wholesaler natively.</p>

                    <form onSubmit={handleCreateSupplier} className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Supplier Name</label>
                          <input
                            required
                            type="text"
                            value={newSupName}
                            onChange={(e) => setNewSupName(e.target.value)}
                            placeholder="Acme Inc"
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-400 rounded-xl px-4 py-3 outline-none transition text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Industry</label>
                          <select
                            value={newSupIndustry}
                            onChange={(e) => setNewSupIndustry(e.target.value)}
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-400 rounded-xl px-4 py-3 outline-none transition text-sm"
                          >
                            <option value="retail">Retail</option>
                            <option value="food">Food</option>
                            <option value="tech">Tech</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Contact Phone</label>
                        <input
                          required
                          type="tel"
                          value={newSupPhone}
                          onChange={(e) => setNewSupPhone(e.target.value)}
                          placeholder="254..."
                          className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-400 rounded-xl px-4 py-3 outline-none transition text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">M-Pesa Shortcode</label>
                          <input
                            type="text"
                            value={newSupMpesa}
                            onChange={(e) => setNewSupMpesa(e.target.value)}
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-400 rounded-xl px-4 py-3 outline-none transition text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Passkey</label>
                          <input
                            type="password"
                            value={newSupPasskey}
                            onChange={(e) => setNewSupPasskey(e.target.value)}
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-400 rounded-xl px-4 py-3 outline-none transition text-sm"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isCreating}
                        className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl hover:bg-black transition shadow-lg shadow-gray-100 disabled:opacity-50"
                      >
                        {isCreating ? "Finalizing..." : "🚀 Provision Wholesaler"}
                      </button>
                    </form>
                  </>
                )}
             </div>
           </div>
        </section>
      </main>
    </div>
  );
}
