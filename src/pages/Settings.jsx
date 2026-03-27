import { useState, useEffect } from "react";
import { getCurrentUser } from "../services/auth-service";
import { supabase } from "../services/supabase-client";
import { useNavigate, Link } from "react-router-dom";
import usePlanAccess from "../hooks/usePlanAccess";
import UpgradeModal from "../components/UpgradeModal";

const PLAN_LABELS = {
  free: { label: "Free", color: "bg-gray-100 text-gray-700", desc: "Basic storefront" },
  basic: { label: "Basic", color: "bg-green-100 text-green-700", desc: "Auto-checkout & receipts" },
  pro: { label: "Pro", color: "bg-blue-100 text-blue-700", desc: "Smart revision & subdomains" },
  business: { label: "Business", color: "bg-purple-100 text-purple-700", desc: "Full scale operations" },
};

export default function Settings() {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [formData, setFormData] = useState({
    name: "", description: "", tagline: "", address: "", google_maps_url: "",
    phone: "", whatsapp_number: "", is_online: true, subdomain: "",
    mpesa_shortcode: "", mpesa_passkey: "",
    offers_pickup: true, offers_delivery: false, delivery_fee: 0,
    list_in_global_marketplace: true,
  });

  const [kycData, setKycData] = useState({
    legal_business_name: "", business_type: "individual", kra_pin: "",
    owner_full_name: "", mpesa_phone: "", verification_status: "tier1"
  });
  const [kycSaving, setKycSaving] = useState(false);
  const [kycUploading, setKycUploading] = useState({ director_id_url: false, business_permit_url: false, kra_cert_url: false });

  const [logoPreview, setLogoPreview] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("storefront");

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdOk, setPwdOk] = useState(false);

  const [allCommunities, setAllCommunities] = useState([]);
  const [joinedCommunityIds, setJoinedCommunityIds] = useState(new Set());
  const [showUpgrade, setShowUpgrade] = useState(false);

  const navigate = useNavigate();
  const user = getCurrentUser();
  const shopId = user?.shop_id;
  const planAccess = usePlanAccess();

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    async function fetchData() {
      if (!shopId) return;
      const { data: sData } = await supabase.from("shops").select("*").eq("id", shopId).single();
      if (sData) {
        setShop(sData);
        setFormData({ ...sData });
        if (sData.logo_url) setLogoPreview(sData.logo_url);
        
        const { data: kData } = await supabase.from("shop_kyc").select("*").eq("shop_id", shopId).single();
        if (kData) setKycData(kData);
      }

      const { data: comms } = await supabase.from('communities').select('*').order('name');
      if (comms) setAllCommunities(comms);

      const { data: members } = await supabase.from('shop_communities').select('community_id').eq('shop_id', shopId);
      if (members) setJoinedCommunityIds(new Set(members.map(m => m.community_id)));

      setLoading(false);
    }
    fetchData();
  }, [shopId, navigate, user]);

  const isLocked = (field) => {
    if (shop?.locked_fields?.includes(field) && user?.role !== 'system_admin') return true;
    if (['tagline', 'description', 'delivery_fee'].includes(field)) {
       if (shop?.[field] && shop?.[field] !== "" && user?.role !== 'system_admin') return true;
    }
    return false;
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData };
      if (!planAccess.isPro) delete payload.subdomain;
      const { error } = await supabase.from("shops").update(payload).eq("id", shopId);
      if (error) throw error;
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleInstantToggle = async (field) => {
    setSaving(true);
    const newVal = !formData[field];
    try {
      const { error } = await supabase.from("shops").update({ [field]: newVal }).eq("id", shopId);
      if (error) throw error;
      setFormData(prev => ({ ...prev, [field]: newVal }));
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const path = `logos/${shopId}/logo-${Date.now()}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
      await supabase.from("shops").update({ logo_url: publicUrl }).eq("id", shopId);
      setLogoPreview(publicUrl);
    } catch (err) {
      alert("Logo Error: " + err.message);
    } finally {
      setLogoUploading(false);
    }
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    setKycSaving(true);
    try {
      const { error } = await supabase.from("shop_kyc").upsert({ ...kycData, shop_id: shopId, verification_status: 'pending' });
      if (error) throw error;
      setKycData(prev => ({ ...prev, verification_status: 'pending' }));
      alert("KYC Submitted.");
    } catch (err) {
      alert("KYC Error: " + err.message);
    } finally {
      setKycSaving(false);
    }
  };

  const handleKycUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    setKycUploading(prev => ({ ...prev, [field]: true }));
    try {
      const path = `kyc/${shopId}/${field}-${Date.now()}`;
      const { error } = await supabase.storage.from("shop-documents").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("shop-documents").getPublicUrl(path);
      setKycData(prev => ({ ...prev, [field]: publicUrl }));
    } catch (err) {
      alert("Upload Error: " + err.message);
    } finally {
      setKycUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdSaving(true);
    setPwdError("");
    try {
      if (newPwd !== confirmPwd) throw new Error("Passwords mismatch");
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) throw error;
      setPwdOk(true);
    } catch (err) {
      setPwdError(err.message);
    } finally {
      setPwdSaving(false);
    }
  };

  const renderTabButton = (id, label, icon) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-8 py-4 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === id ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-gray-400 group-hover:text-gray-600'}`}
    >
      <span className="mr-2">{icon}</span> {label}
    </button>
  );

  if (loading) return <div className="p-20 text-center font-black text-gray-400">SYNCING INFRASTRUCTURE...</div>;
  const planInfo = PLAN_LABELS[shop?.plan?.toLowerCase()] || PLAN_LABELS.free;

  return (
    <div className="min-h-screen bg-gray-50/50">
      {showUpgrade && <UpgradeModal featureName="Premium Settings" onClose={() => setShowUpgrade(false)} />}
      
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <Link to="/dashboard" className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-black transition shadow-inner">←</Link>
             <h1 className="text-xl font-black tracking-tighter">System Console</h1>
          </div>
          <span className={`${planInfo.color} px-4 py-1.5 rounded-xl font-black text-[10px] uppercase shadow-sm border border-black/5`}>{planInfo.label}</span>
        </div>
        <div className="max-w-4xl mx-auto px-6 flex overflow-x-auto no-scrollbar scroll-smooth">
           {renderTabButton("storefront", "Store", "🏪")}
           {renderTabButton("fulfillment", "Logistic", "🚗")}
           {renderTabButton("kyc", "Identity", "⚖️")}
           {renderTabButton("communities", "Market", "🌍")}
           {renderTabButton("security", "Safety", "🛡️")}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 pb-32">
        {savedOk && <div className="mb-8 p-5 bg-green-50 border-2 border-green-100 rounded-[2rem] text-green-700 font-black text-[10px] uppercase tracking-widest flex items-center gap-3 animate-bounce">✓ Changes Synchronized</div>}

        {activeTab === 'storefront' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-gray-100 border border-gray-100">
               <div className="flex items-center gap-10 mb-12">
                  <div className="relative w-32 h-32 rounded-[2.5rem] bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                     {logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" /> : <span className="text-5xl grayscale opacity-30">🏪</span>}
                     {logoUploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[10px] font-black">SYNCING</div>}
                  </div>
                  <div className="flex-1 space-y-4">
                     <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Market Branding / Logo</p>
                     <input type="file" onChange={handleLogoChange} className="text-[10px] font-black file:bg-black file:text-white file:rounded-xl file:px-4 file:py-2 file:border-0 cursor-pointer" />
                  </div>
               </div>

               <form onSubmit={handleUpdate} className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Market Name (Locked)</label>
                     <input disabled value={formData.name} className="w-full px-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-400 font-black text-sm cursor-not-allowed" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex justify-between">Tagline {isLocked('tagline') && <span className="text-red-500">Provisioned</span>}</label>
                     <input disabled={isLocked('tagline')} value={formData.tagline} onChange={e => setFormData({...formData, tagline: e.target.value})} className="w-full px-6 py-5 border-2 border-gray-100 rounded-2xl font-black text-sm focus:border-indigo-600 outline-none" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex justify-between">Full description {isLocked('description') && <span className="text-red-500">Provisioned</span>}</label>
                     <textarea disabled={isLocked('description')} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-6 py-5 border-2 border-gray-100 rounded-2xl font-medium text-sm focus:border-indigo-600 outline-none" rows="4" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Customer Phone</label>
                     <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-6 py-5 border-2 border-gray-100 rounded-2xl font-black text-sm focus:border-indigo-600 outline-none" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-green-700 uppercase tracking-widest px-1">WhatsApp Route</label>
                     <input value={formData.whatsapp_number} onChange={e => setFormData({...formData, whatsapp_number: e.target.value})} className="w-full px-6 py-5 border-2 border-green-100 bg-green-50/20 rounded-2xl font-black text-sm focus:border-green-600 outline-none" />
                  </div>
                  <button type="submit" disabled={saving} className="md:col-span-2 bg-gray-900 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-gray-200">COMMIT CHANGES</button>
               </form>
            </div>
          </div>
        )}

        {activeTab === 'fulfillment' && (
           <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-gray-100 border border-gray-100">
                 <h2 className="text-lg font-black mb-8">Logistics Architecture</h2>
                 <div className="space-y-4">
                    {['offers_dine_in', 'offers_pickup', 'offers_delivery'].map(f => (
                       <div key={f} className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl">
                          <p className="text-sm font-black uppercase tracking-widest text-gray-600">{f.replace(/_/g, ' ')}</p>
                          <button onClick={() => handleInstantToggle(f)} className={`w-14 h-8 rounded-full transition-all ${formData[f] ? 'bg-green-500' : 'bg-gray-300'} relative`}>
                             <span className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all ${formData[f] ? 'right-1' : 'left-1'}`} />
                          </button>
                       </div>
                    ))}
                    {formData.offers_delivery && (
                       <div className="p-8 bg-green-50 border-2 border-green-100 rounded-[2rem] mt-6">
                          <label className="text-[10px] font-black text-green-700 uppercase mb-4 block">Logistics Flat Fee (KSh) {isLocked('delivery_fee') && <span className="bg-white px-2 py-1 rounded border ml-2">Provisioned</span>}</label>
                          <input disabled={isLocked('delivery_fee')} value={formData.delivery_fee} onChange={e => setFormData({...formData, delivery_fee: e.target.value.replace(/[^0-9]/g,'')})} className="w-full bg-white border-2 border-green-100 px-6 py-5 rounded-2xl text-2xl font-black outline-none" />
                       </div>
                    )}
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'kyc' && (
           <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-gray-100 border border-gray-100">
                 <div className="flex justify-between items-start mb-10">
                    <h2 className="text-lg font-black">Identity Verification</h2>
                    <span className="px-4 py-1.5 rounded-xl bg-gray-900 text-white text-[10px] font-black uppercase">{kycData.verification_status}</span>
                 </div>
                 <form onSubmit={handleKycSubmit} className="space-y-8">
                    <input value={kycData.legal_business_name} onChange={e => setKycData({...kycData, legal_business_name: e.target.value})} placeholder="Legal Business Name" className="w-full px-6 py-5 border-2 border-gray-100 rounded-2xl font-black text-sm" />
                    <div className="grid md:grid-cols-2 gap-8">
                       <input value={kycData.kra_pin} onChange={e => setKycData({...kycData, kra_pin: e.target.value})} placeholder="KRA PIN" className="w-full px-6 py-5 border-2 border-gray-100 rounded-2xl font-black text-sm uppercase" />
                       <input value={kycData.mpesa_phone} onChange={e => setKycData({...kycData, mpesa_phone: e.target.value})} placeholder="Payout M-Pesa Phone" className="w-full px-6 py-5 border-2 border-gray-100 rounded-2xl font-black text-sm" />
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-widest">SUBMIT IDENTITY</button>
                 </form>
              </div>
           </div>
        )}

        {activeTab === 'communities' && (
           <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-gray-100 border border-gray-100">
                 <h2 className="text-lg font-black mb-10">Savannah Discovery Networks</h2>
                 <div className="grid gap-6">
                    {allCommunities.map(c => {
                       const joined = joinedCommunityIds.has(c.id);
                       return (
                          <div key={c.id} className="flex items-center justify-between p-6 border-2 border-gray-50 rounded-3xl hover:border-indigo-100 transition-all">
                             <div className="flex items-center gap-6">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-2xl shadow-inner">🌍</div>
                                <div>
                                   <p className="text-sm font-black">{c.name}</p>
                                   <p className="text-[10px] text-indigo-500 font-black tracking-widest uppercase">/{c.slug}</p>
                                </div>
                             </div>
                             <button className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${joined ? 'bg-white border-green-500 text-green-600' : 'bg-gray-900 text-white'}`}>
                                {joined ? 'Joined ✓' : 'Link Shop'}
                             </button>
                          </div>
                       );
                    })}
                 </div>
              </div>
           </div>
        )}

        {activeTab === 'security' && (
           <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-[2.5rem] p-10 shadow-xl shadow-gray-100 border border-gray-100">
                 <h2 className="text-lg font-black mb-10">Administrative Password</h2>
                 <form onSubmit={handlePasswordChange} className="space-y-6">
                    <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="New Password" className="w-full px-6 py-5 border-2 border-gray-100 rounded-2xl font-black text-sm" />
                    <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Confirm Password" className="w-full px-6 py-5 border-2 border-gray-100 rounded-2xl font-black text-sm" />
                    <button type="submit" disabled={pwdSaving} className="w-full bg-gray-900 text-white py-6 rounded-3xl font-black uppercase text-xs tracking-widest">{pwdSaving ? 'UPDATING...' : 'ROTATE KEYS'}</button>
                 </form>
              </div>

              <div className="p-10 bg-indigo-600 rounded-[3rem] text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl animate-pulse"></div>
                 <h3 className="text-sm font-black uppercase tracking-widest mb-4">Financial Architecture</h3>
                 <p className="text-xs text-indigo-100 leading-relaxed opacity-80 mb-6">Commission is retained at <span className="text-white font-black">{shop?.platform_commission_rate ?? 5}%</span>. Settlement is reconciled weekly to your verified payout destination.</p>
                 <div className="flex gap-4">
                    <div className="bg-white/10 p-4 rounded-2xl border border-white/20 flex-1"><p className="text-[10px] font-black uppercase mb-1 opacity-60">Cycle</p><p className="text-lg font-black">Weekly</p></div>
                    <div className="bg-white/10 p-4 rounded-2xl border border-white/20 flex-1"><p className="text-[10px] font-black uppercase mb-1 opacity-60">Target</p><p className="text-lg font-black uppercase">M-Pesa</p></div>
                 </div>
              </div>
           </div>
        )}
      </main>
    </div>
  );
}
