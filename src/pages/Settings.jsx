import { useState, useEffect } from "react";
import { getCurrentUser } from "../services/auth-service";
import { supabase } from "../services/supabase-client";
import { useNavigate, Link } from "react-router-dom";
import usePlanAccess from "../hooks/usePlanAccess";
import UpgradeModal from "../components/UpgradeModal";

const PLAN_LABELS = {
  free: { label: "Free", color: "bg-gray-100 text-gray-700", desc: "Click-to-chat orders only" },
  basic: { label: "Basic", color: "bg-green-100 text-green-700", desc: "Auto-checkout & structured receipts" },
  pro: { label: "Pro", color: "bg-blue-100 text-blue-700", desc: "Smart revisions & analytics" },
  business: { label: "Business", color: "bg-purple-100 text-purple-700", desc: "Full scale operations" },
  enterprise: { label: "Enterprise", color: "bg-amber-100 text-amber-700", desc: "Custom integrations" },
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
    industry_type: "restaurant", offers_dine_in: true, offers_digital: false,
    list_in_global_marketplace: true
  });

  // KYC States
  const [kycData, setKycData] = useState({
    legal_business_name: "", business_type: "individual", business_reg_number: "", kra_pin: "",
    county_city: "", store_type: "online_only",
    owner_full_name: "", owner_phone: "", owner_national_id: "",
    mpesa_phone: "", mpesa_account_name: "", bank_name: "", bank_account_no: "",
    director_id_url: "", business_permit_url: "", kra_cert_url: "",
    verification_status: "tier1"
  });
  const [kycSaving, setKycSaving] = useState(false);
  const [kycUploading, setKycUploading] = useState({ director_id_url: false, business_permit_url: false, kra_cert_url: false });

  // Logo upload
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);

  // Password change
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdOk, setPwdOk] = useState(false);

  const [showUpgrade, setShowUpgrade] = useState(false);

  const navigate = useNavigate();
  const user = getCurrentUser();
  const shopId = user?.shop_id;
  const planAccess = usePlanAccess();

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    async function fetchShop() {
      if (!shopId) return;
      const { data } = await supabase.from("shops").select("*").eq("id", shopId).single();
      if (data) {
        setShop(data);
        setFormData({
          name: data.name || "", description: data.description || "",
          tagline: data.tagline || "", address: data.address || "", google_maps_url: data.google_maps_url || "",
          phone: data.phone || "", whatsapp_number: data.whatsapp_number || "",
          is_online: data.is_online ?? true, subdomain: data.subdomain || "",
          mpesa_shortcode: data.mpesa_shortcode || "", mpesa_passkey: data.mpesa_passkey || "",
          offers_pickup: data.offers_pickup ?? true, 
          offers_delivery: data.offers_delivery ?? false, 
          delivery_fee: data.delivery_fee || 0,
          industry_type: data.industry_type || "restaurant",
          offers_dine_in: data.offers_dine_in ?? true,
          offers_digital: data.offers_digital ?? false,
          list_in_global_marketplace: data.list_in_global_marketplace ?? true
        });
        if (data.logo_url) setLogoPreview(data.logo_url);
        
        // Fetch KYC data
        const { data: kyc } = await supabase.from("shop_kyc").select("*").eq("shop_id", shopId).single();
        if (kyc) {
           setKycData(kyc);
        } else {
           // Insert a placeholder to prevent upsert conflicts
           await supabase.from("shop_kyc").insert({ shop_id: shopId, legal_business_name: "Pending", kra_pin: "Pending", verification_status: "tier1" }).select().single();
        }
      }
      setLoading(false);
    }
    fetchShop();
  }, [shopId, navigate, user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedOk(false);
    try {
      const updatePayload = { ...formData };
      
      // Nullify empty subdomain to avoid Postgres UNIQUE constraint errors
      if (updatePayload.subdomain === "") updatePayload.subdomain = null;
      // Only update subdomain for Pro+ shops
      if (!planAccess.isPro) delete updatePayload.subdomain;

      // Only allow M-Pesa configurations for Basic+
      if (planAccess.isFree) {
          delete updatePayload.mpesa_shortcode;
          delete updatePayload.mpesa_passkey;
      }

      const { error } = await supabase.from("shops").update(updatePayload).eq("id", shopId);
      
      if (error) {
         // If error is about missing columns (e.g. subdomain, offers_dine_in)
         if (error.code === '42703') {
             delete updatePayload.subdomain;
             delete updatePayload.offers_dine_in;
             delete updatePayload.offers_digital;
             const { error: fallbackError } = await supabase.from("shops").update(updatePayload).eq("id", shopId);
             if (fallbackError) throw fallbackError;
         } else {
             throw error;
         }
      }
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    } catch (err) {
      alert("Failed to update settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleOnline = async () => {
    setSaving(true);
    const newStatus = !formData.is_online;
    try {
      const { error } = await supabase.from("shops").update({ is_online: newStatus }).eq("id", shopId);
      if (error) throw error;
      setFormData(prev => ({ ...prev, is_online: newStatus }));
    } catch (err) {
      alert("Failed to toggle status: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLogoFile(file);
    const tempUrl = URL.createObjectURL(file);
    setLogoPreview(tempUrl);
    setLogoUploading(true);
    
    try {
      const ext = file.name.split('.').pop();
      const path = `logos/${shopId}/logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      const logoUrl = urlData.publicUrl;
      await supabase.from("shops").update({ logo_url: logoUrl }).eq("id", shopId);
      
      setLogoPreview(logoUrl);
      setLogoFile(null); // clear after successful upload
    } catch (err) {
      alert("Logo upload failed: " + err.message);
      // Revert if it completely failed and we had no previous logo
      if (tempUrl === logoPreview) setLogoPreview(null); 
    } finally {
      setLogoUploading(false);
    }
  };

  const handleKycSubmit = async (e) => {
    e.preventDefault();
    setKycSaving(true);
    try {
      const payload = { ...kycData, verification_status: 'pending' };
      delete payload.id;
      delete payload.created_at;
      delete payload.shop_id; // prevent mutation errors

      const { error } = await supabase.from("shop_kyc").update(payload).eq("shop_id", shopId);
      if (error) throw error;
      
      setKycData(prev => ({ ...prev, verification_status: 'pending' }));
      alert("✅ Verification documents submitted successfully. They are now pending Admin review.");
    } catch (err) {
      alert("Failed to submit KYC: " + err.message);
    } finally {
      setKycSaving(false);
    }
  };

  const handleKycUpload = async (e, fieldKey) => {
    const file = e.target.files[0];
    if (!file) return;
    setKycUploading(prev => ({...prev, [fieldKey]: true}));
    
    try {
      const ext = file.name.split('.').pop();
      const path = `${shopId}/${fieldKey}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("shop-documents").upload(path, file, { upsert: true });
      if (error) {
         if (error.message.includes('Bucket not found')) throw new Error("Storage bucket 'shop-documents' does not exist. Please inform the system admin.");
         throw error;
      }
      const { data } = supabase.storage.from("shop-documents").getPublicUrl(path);
      setKycData(prev => ({ ...prev, [fieldKey]: data.publicUrl }));
    } catch (err) {
      alert("Document upload failed: " + err.message);
    } finally {
      setKycUploading(prev => ({...prev, [fieldKey]: false}));
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdError(""); setPwdOk(false);
    if (!currentPwd) { setPwdError("Current password is required."); return; }
    if (newPwd.length < 8) { setPwdError("Minimum 8 characters."); return; }
    if (newPwd !== confirmPwd) { setPwdError("Passwords do not match."); return; }
    
    setPwdSaving(true);
    try {
      // 1. Verify current password
      const { error: signInErr } = await supabase.auth.signInWithPassword({
         email: user.email,
         password: currentPwd
      });
      if (signInErr) throw new Error("Current password is incorrect.");

      // 2. Update to new password
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) throw error;
      
      setPwdOk(true);
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      setTimeout(() => setPwdOk(false), 3000);
    } catch (err) {
      setPwdError(err.message);
    } finally {
      setPwdSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

  const planKey = shop?.plan?.toLowerCase() || "free";
  const planInfo = PLAN_LABELS[planKey] || PLAN_LABELS.free;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {showUpgrade && <UpgradeModal featureName="Higher Plan" onClose={() => setShowUpgrade(false)} />}

      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Shop Settings</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* Plan Status + Expiry */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">Current Plan</p>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${planInfo.color}`}>{planInfo.label}</span>
                <span className="text-sm text-gray-500">{planInfo.desc}</span>
              </div>
            </div>
            {!planAccess.isPro && (
              <button
                onClick={() => setShowUpgrade(true)}
                className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition"
              >
                ⬆ Upgrade Plan
              </button>
            )}
          </div>
          {/* Expiry Warning */}
          {shop?.plan_expires_at && (() => {
            const daysLeft = Math.ceil((new Date(shop.plan_expires_at) - new Date()) / (1000 * 60 * 60 * 24));
            if (daysLeft <= 0) return (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium flex items-center gap-2">
                <span>🔴</span>
                <span>Your <strong>{planInfo.label}</strong> plan has <strong>expired</strong>. You have been downgraded to Free. Renew to restore access.</span>
              </div>
            );
            if (daysLeft <= 7) return (
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700 font-medium flex items-center gap-2">
                <span>⚠️</span>
                <span>Your plan expires in <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong>. Renew to keep your features.</span>
              </div>
            );
            return (
              <div className="mt-4 p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs text-gray-400">
                Plan renews: {new Date(shop.plan_expires_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            );
          })()}
        </div>

        {/* Storefront Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Storefront Status</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {formData.is_online ? "🟢 Open — accepting live orders" : "🔴 Closed — shop is paused"}
              </p>
            </div>
            <button
              onClick={handleToggleOnline}
              disabled={saving}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${formData.is_online ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow ${formData.is_online ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-gray-100">
            <div>
               <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  🌍 Global Marketplace
               </h2>
               <p className="text-sm text-gray-500 mt-0.5 max-w-sm">
                  Allow your products and shop to be discovered by thousands of customers on the Savannah public Discover feed.
               </p>
            </div>
            <button
               onClick={async () => {
                  const newStatus = !formData.list_in_global_marketplace;
                  setSaving(true);
                  try {
                     const { error } = await supabase.from("shops").update({ list_in_global_marketplace: newStatus }).eq("id", shopId);
                     if (error) throw error;
                     setFormData(prev => ({ ...prev, list_in_global_marketplace: newStatus }));
                  } catch (err) {
                     alert("Failed to toggle marketplace visibility: " + err.message);
                  } finally {
                     setSaving(false);
                  }
               }}
               disabled={saving}
               className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${formData.list_in_global_marketplace ? 'bg-blue-500' : 'bg-gray-300'}`}
            >
               <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow ${formData.list_in_global_marketplace ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        {/* Shop Logo */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Shop Logo</h2>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
              {logoPreview
                ? <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                : <span className="text-3xl">🏪</span>}
            </div>
            <div className="flex-1">
              <input type="file" accept="image/*" onChange={handleLogoChange} disabled={logoUploading} className="text-sm text-gray-600 mb-3 block" />
              {logoUploading && <p className="text-xs text-indigo-600 font-bold animate-pulse">Uploading and saving...</p>}
            </div>
          </div>
        </div>

        {/* Shop Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-6">Shop Information</h2>
          <form onSubmit={handleUpdate} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Shop Name</label>
                <input type="text" required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Tagline</label>
                <input type="text" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm" value={formData.tagline} onChange={e => setFormData({...formData, tagline: e.target.value})} placeholder="e.g. Best Burgers in Nairobi" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Description</label>
              <textarea className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Tell your customers about your shop..." />
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Phone Number</label>
                <input type="text" required className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">WhatsApp Number <span className="text-green-600">★ Orders route here</span></label>
                <input type="text" className="w-full px-4 py-2.5 border border-green-200 bg-green-50 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm" value={formData.whatsapp_number} onChange={e => setFormData({...formData, whatsapp_number: e.target.value})} placeholder="+254700000000" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Physical Address</label>
              <textarea className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm" rows="2" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Where are you located?" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Google Maps Pin URL (Optional)</label>
              <input type="url" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-500 outline-none text-sm" value={formData.google_maps_url} onChange={e => setFormData({...formData, google_maps_url: e.target.value})} placeholder="https://maps.app.goo.gl/..." />
            </div>
            {/* Subdomain — Pro+ only */}
            <div className={`rounded-xl border p-4 ${planAccess.isPro ? 'border-blue-100 bg-blue-50/30' : 'border-gray-100 bg-gray-50 opacity-70'}`}>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-gray-700">Custom Subdomain</label>
                {!planAccess.isPro && (
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-bold">🔒 Pro+</span>
                )}
              </div>
              {planAccess.isPro ? (
                <>
                  <div className="flex items-center gap-0 rounded-xl border border-gray-200 overflow-hidden bg-white">
                    <input
                      type="text"
                      value={formData.subdomain}
                      onChange={e => setFormData({...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,'')})}
                      placeholder="yourshop"
                      className="flex-1 px-4 py-2.5 outline-none text-sm"
                    />
                    <span className="px-3 py-2.5 text-sm text-gray-400 bg-gray-50 border-l border-gray-200">.tmsavannah.com</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1.5">Customers can access your shop at <strong>{formData.subdomain || 'yourshop'}.tmsavannah.com</strong></p>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm text-gray-400">
                    {shop?.subdomain ? `${shop.subdomain}.tmsavannah.com` : "e.g. myshop.tmsavannah.com"}
                  </div>
                  <button type="button" onClick={() => setShowUpgrade(true)} className="text-xs text-blue-600 font-bold hover:underline whitespace-nowrap">
                    Unlock →
                  </button>
                </div>
              )}
            </div>

            {/* Fulfillment configuration */}
            <div className="mt-6 rounded-xl border border-gray-100 p-5 bg-white">
               <div className="flex justify-between items-center mb-4">
                 <h3 className="text-base font-bold text-gray-900">Shop Type & Fulfillment</h3>
               </div>

               <div className="mb-6">
                 <label className="block text-sm font-bold text-gray-700 mb-1.5">Shop Industry Type</label>
                 <select 
                    value={formData.industry_type}
                    onChange={(e) => setFormData({...formData, industry_type: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm bg-white"
                 >
                   <option value="restaurant">Restaurant / Food & Beverage</option>
                   <option value="retail">Online Shop / Physical Retail</option>
                   <option value="digital">Digital Products / Downloads</option>
                 </select>
               </div>

               <div className="space-y-4">
                 
                 {formData.industry_type === 'restaurant' && (
                   <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                     <div>
                       <p className="text-sm font-bold text-gray-800">🍽️ Allow Dine-In</p>
                       <p className="text-xs text-gray-500 mt-0.5">Customers can order directly from their tables.</p>
                     </div>
                     <button
                       type="button"
                       onClick={() => setFormData(p => ({...p, offers_dine_in: !p.offers_dine_in}))}
                       className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.offers_dine_in ? 'bg-green-500' : 'bg-gray-300'}`}
                     >
                       <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.offers_dine_in ? 'translate-x-6' : 'translate-x-1'}`} />
                     </button>
                   </div>
                 )}

                 {['restaurant', 'retail'].includes(formData.industry_type) && (
                   <>
                     <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                       <div>
                         <p className="text-sm font-bold text-gray-800">🛍️ Allow Pickup</p>
                         <p className="text-xs text-gray-500 mt-0.5">Customers can order ahead and pick up their items</p>
                       </div>
                       <button
                         type="button"
                         onClick={() => setFormData(p => ({...p, offers_pickup: !p.offers_pickup}))}
                         className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.offers_pickup ? 'bg-green-500' : 'bg-gray-300'}`}
                       >
                         <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.offers_pickup ? 'translate-x-6' : 'translate-x-1'}`} />
                       </button>
                     </div>

                     <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                       <div>
                         <p className="text-sm font-bold text-gray-800">🚗 Allow Delivery</p>
                         <p className="text-xs text-gray-500 mt-0.5">Customers can request delivery to their address</p>
                       </div>
                       <button
                         type="button"
                         onClick={() => setFormData(p => ({...p, offers_delivery: !p.offers_delivery}))}
                         className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.offers_delivery ? 'bg-green-500' : 'bg-gray-300'}`}
                       >
                         <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.offers_delivery ? 'translate-x-6' : 'translate-x-1'}`} />
                       </button>
                     </div>

                     {formData.offers_delivery && (
                       <div className="pl-3 mt-2 border-l-2 border-green-200">
                         <label className="block text-sm font-bold text-gray-700 mb-1.5">Flat Delivery Fee (KSh)</label>
                         <input
                           type="number"
                           min="0"
                           value={formData.delivery_fee}
                           onChange={e => setFormData({...formData, delivery_fee: parseInt(e.target.value) || 0})}
                           placeholder="e.g. 150"
                           className="w-full md:w-1/2 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm bg-white"
                         />
                         <p className="text-xs text-gray-400 mt-1">This amount will be added to the customer's total.</p>
                       </div>
                     )}
                   </>
                 )}

                 {formData.industry_type === 'digital' && (
                    <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                      <div>
                        <p className="text-sm font-bold text-indigo-800">💻 Digital Delivery Only</p>
                        <p className="text-xs text-indigo-600 mt-0.5">Physical fulfillment is hidden. Customers will provide an email address at checkout.</p>
                      </div>
                    </div>
                 )}
               </div>
            </div>

            {/* M-Pesa Automatic Checkout — Basic+ */}
            <div className={`mt-6 rounded-xl border p-5 ${!planAccess.isFree ? 'border-green-100 bg-green-50/20' : 'border-gray-100 bg-gray-50 opacity-70'}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <label className="block text-base font-bold text-gray-900">M-Pesa Auto-Checkout</label>
                  <p className="text-xs text-gray-500 mt-0.5">Allow customers to pay instantly via STK Push to your Till/Paybill.</p>
                </div>
                {planAccess.isFree && (
                  <span className="text-xs bg-gray-200 text-gray-600 px-3 py-1 rounded-full font-bold shadow-sm">🔒 Basic+</span>
                )}
              </div>
              
              {!planAccess.isFree ? (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Till or Paybill Shortcode</label>
                    <input
                      type="text"
                      value={formData.mpesa_shortcode}
                      onChange={e => setFormData({...formData, mpesa_shortcode: e.target.value.replace(/[^0-9]/g, '')})}
                      placeholder="e.g. 174379"
                      className="w-full px-4 py-2.5 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Daraja API Passkey</label>
                    <input
                      type="password"
                      value={formData.mpesa_passkey}
                      onChange={e => setFormData({...formData, mpesa_passkey: e.target.value})}
                      placeholder="bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
                      className="w-full px-4 py-2.5 border border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm bg-white font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm text-gray-400 italic">
                    Upgrade to unlock M-Pesa automatic payments
                  </div>
                  <button type="button" onClick={() => setShowUpgrade(true)} className="bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition">
                    Enable
                  </button>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center gap-4">
              <button type="submit" disabled={saving} className="bg-gray-900 text-white px-7 py-2.5 rounded-xl font-bold hover:bg-gray-800 transition disabled:opacity-50 text-sm">
                {saving ? "Saving..." : "Save Changes"}
              </button>
              {savedOk && <span className="text-green-600 text-sm font-semibold">✓ Saved successfully!</span>}
            </div>
          </form>
        </div>

        {/* --- KYC & Compliance Module --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-start mb-4">
             <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                   ⚖️ Compliance & Identity Verification
                </h2>
                <p className="text-sm text-gray-500 mt-1">Required to unlock unrestricted M-Pesa payouts and limits.</p>
             </div>
             <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${
               ['tier3', 'approved'].includes(kycData.verification_status) ? 'bg-green-100 text-green-800' :
               kycData.verification_status === 'pending' ? 'bg-amber-100 text-amber-800' :
               kycData.verification_status === 'rejected' ? 'bg-red-100 text-red-800' :
               'bg-gray-100 text-gray-800'
             }`}>
                {kycData.verification_status}
             </span>
          </div>
          
          <form onSubmit={handleKycSubmit} className="space-y-6">
             {/* --- TIER 2: BUSINESS INFO --- */}
             <div className="pt-2 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 mb-4">Tier 2: Business & Operations Profile</h3>
                <div className="grid md:grid-cols-2 gap-5">
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1.5">Legal Business Name</label>
                     <input type="text" required value={kycData.legal_business_name} onChange={e => setKycData({...kycData, legal_business_name: e.target.value})} disabled={kycData.verification_status === 'tier3'} className="w-full px-4 py-2 border border-blue-200 bg-blue-50/20 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:opacity-50" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1.5">Business Structure</label>
                     <select value={kycData.business_type} onChange={e => setKycData({...kycData, business_type: e.target.value})} disabled={kycData.verification_status === 'tier3'} className="w-full px-4 py-2 border border-blue-200 bg-blue-50/20 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:opacity-50">
                        <option value="individual">Individual / Sole Proprietor</option>
                        <option value="partnership">Partnership</option>
                        <option value="company">Registered Company</option>
                     </select>
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1.5">Registration No. / Certificate No.</label>
                     <input type="text" value={kycData.business_reg_number} onChange={e => setKycData({...kycData, business_reg_number: e.target.value})} disabled={kycData.verification_status === 'tier3'} className="w-full px-4 py-2 border border-blue-200 bg-blue-50/20 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:opacity-50" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1.5">Tax Details (KRA PIN)</label>
                     <input type="text" required value={kycData.kra_pin} onChange={e => setKycData({...kycData, kra_pin: e.target.value})} disabled={kycData.verification_status === 'tier3'} className="w-full px-4 py-2 border border-blue-200 bg-blue-50/20 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono uppercase disabled:opacity-50" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1.5">County/City</label>
                     <input type="text" required value={kycData.county_city} onChange={e => setKycData({...kycData, county_city: e.target.value})} disabled={kycData.verification_status === 'tier3'} placeholder="e.g. Nairobi" className="w-full px-4 py-2 border border-blue-200 bg-blue-50/20 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:opacity-50" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1.5">Store Deployment</label>
                     <select value={kycData.store_type} onChange={e => setKycData({...kycData, store_type: e.target.value})} disabled={kycData.verification_status === 'tier3'} className="w-full px-4 py-2 border border-blue-200 bg-blue-50/20 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:opacity-50">
                        <option value="physical">Physical Brick & Mortar</option>
                        <option value="online_only">Online Only</option>
                        <option value="mobile_vendor">Mobile / Pop-up Vendor</option>
                     </select>
                   </div>
                </div>
             </div>

             {/* --- TIER 3: OWNER IDENTITY & FINANCIALS --- */}
             <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 mb-4">Tier 3: Identity & Financials (Payout Unlock)</h3>
                <div className="grid md:grid-cols-3 gap-5">
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1.5">Owner Full Name</label>
                     <input type="text" value={kycData.owner_full_name} onChange={e => setKycData({...kycData, owner_full_name: e.target.value})} disabled={kycData.verification_status === 'tier3'} className="w-full px-4 py-2 border border-indigo-200 bg-indigo-50/20 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm disabled:opacity-50" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1.5">National ID Number</label>
                     <input type="text" value={kycData.owner_national_id} onChange={e => setKycData({...kycData, owner_national_id: e.target.value})} disabled={kycData.verification_status === 'tier3'} className="w-full px-4 py-2 border border-indigo-200 bg-indigo-50/20 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm disabled:opacity-50" />
                   </div>
                   <div>
                     <label className="block text-sm font-bold text-gray-700 mb-1.5">Personal Phone</label>
                     <input type="text" value={kycData.owner_phone} onChange={e => setKycData({...kycData, owner_phone: e.target.value})} disabled={kycData.verification_status === 'tier3'} className="w-full px-4 py-2 border border-indigo-200 bg-indigo-50/20 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm disabled:opacity-50" />
                   </div>
                   <div className="md:col-span-1">
                     <label className="block text-sm font-bold text-gray-700 mb-1.5">Payout M-Pesa Phone</label>
                     <input type="text" value={kycData.mpesa_phone} onChange={e => setKycData({...kycData, mpesa_phone: e.target.value})} disabled={kycData.verification_status === 'tier3'} className="w-full px-4 py-2 border border-indigo-200 bg-indigo-50/20 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono disabled:opacity-50" />
                   </div>
                   <div className="md:col-span-2">
                     <label className="block text-sm font-bold text-gray-700 mb-1.5">M-Pesa Registered Name</label>
                     <input type="text" value={kycData.mpesa_account_name} onChange={e => setKycData({...kycData, mpesa_account_name: e.target.value})} disabled={kycData.verification_status === 'tier3'} className="w-full px-4 py-2 border border-indigo-200 bg-indigo-50/20 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm disabled:opacity-50" />
                   </div>
                </div>
             </div>

             <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-800">Secure Document Uploads</h3>
                
                {/* Director ID */}
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
                   <div>
                      <p className="text-sm font-bold text-gray-800">Director National ID / Passport</p>
                      <p className="text-xs text-gray-500 mt-0.5">Clear image or PDF of identifying document.</p>
                   </div>
                   <div className="flex items-center gap-3">
                      {kycData.director_id_url && <a href={kycData.director_id_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-bold hover:underline">View Uploaded</a>}
                      <label className={`bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${kycData.verification_status === 'tier3' ? 'opacity-50 pointer-events-none' : ''}`}>
                         {kycUploading.director_id_url ? 'Uploading...' : 'Upload File'}
                         <input type="file" accept="image/*,.pdf" className="hidden" disabled={kycData.verification_status === 'tier3' || kycUploading.director_id_url} onChange={(e) => handleKycUpload(e, 'director_id_url')} />
                      </label>
                   </div>
                </div>

                {/* Business Certificate */}
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
                   <div>
                      <p className="text-sm font-bold text-gray-800">Business Registration Cert.</p>
                      <p className="text-xs text-gray-500 mt-0.5">Required for Companies / Partnerships.</p>
                   </div>
                   <div className="flex items-center gap-3">
                      {kycData.business_permit_url && <a href={kycData.business_permit_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-bold hover:underline">View Uploaded</a>}
                      <label className={`bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${kycData.verification_status === 'tier3' ? 'opacity-50 pointer-events-none' : ''}`}>
                         {kycUploading.business_permit_url ? 'Uploading...' : 'Upload File'}
                         <input type="file" accept="image/*,.pdf" className="hidden" disabled={kycData.verification_status === 'tier3' || kycUploading.business_permit_url} onChange={(e) => handleKycUpload(e, 'business_permit_url')} />
                      </label>
                   </div>
                </div>

                {/* KRA PIN Cert */}
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
                   <div>
                      <p className="text-sm font-bold text-gray-800">KRA PIN Certificate</p>
                      <p className="text-xs text-gray-500 mt-0.5">Official tax registration document.</p>
                   </div>
                   <div className="flex items-center gap-3">
                      {kycData.kra_cert_url && <a href={kycData.kra_cert_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-bold hover:underline">View Uploaded</a>}
                      <label className={`bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${kycData.verification_status === 'tier3' ? 'opacity-50 pointer-events-none' : ''}`}>
                         {kycUploading.kra_cert_url ? 'Uploading...' : 'Upload File'}
                         <input type="file" accept="image/*,.pdf" className="hidden" disabled={kycData.verification_status === 'tier3' || kycUploading.kra_cert_url} onChange={(e) => handleKycUpload(e, 'kra_cert_url')} />
                      </label>
                   </div>
                </div>
             </div>

             <div className="pt-2">
                <button type="submit" disabled={kycSaving || kycData.verification_status === 'tier3'} className="w-full bg-blue-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 text-sm flex items-center justify-center gap-2">
                   {kycSaving ? "Submitting for Review..." : "Submit Profile for Verification"}
                </button>
             </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-1">Change Password</h2>
          <p className="text-sm text-gray-500 mb-5">Update your account password at any time.</p>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {pwdError && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 font-medium">{pwdError}</div>}
            {pwdOk && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm border border-green-100 font-medium">✓ Password updated successfully!</div>}
            <div className="grid md:grid-cols-2 gap-5 mb-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Current Password</label>
                <input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} required placeholder="Enter current password" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">New Password</label>
                <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required minLength={8} placeholder="Min. 8 characters" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Confirm Password</label>
                <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required placeholder="Repeat password" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-500 outline-none text-sm" />
              </div>
            </div>
            <button type="submit" disabled={pwdSaving} className="bg-gray-900 text-white px-7 py-2.5 rounded-xl font-bold hover:bg-gray-800 transition disabled:opacity-50 text-sm">
              {pwdSaving ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

        {/* Commission & Settlement Info */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
          <h2 className="text-base font-bold text-indigo-900 mb-1">💰 Platform Commission & Settlement</h2>
          <p className="text-sm text-indigo-700 mb-4">ShopQR retains a platform fee on every paid order. Your net payout is settled by the platform operator.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-indigo-100">
              <p className="text-xs text-gray-400 uppercase font-bold mb-1">Your Commission Rate</p>
              <p className="text-2xl font-black text-indigo-700">{shop?.platform_commission_rate ?? 5}%</p>
              <p className="text-[11px] text-gray-400 mt-1">of goods sold per order</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-indigo-100">
              <p className="text-xs text-gray-400 uppercase font-bold mb-1">Delivery Fees</p>
              <p className="text-sm font-bold text-indigo-700 mt-2">Retained by Platform</p>
              <p className="text-[11px] text-gray-400 mt-1">When platform runs delivery</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-indigo-100">
              <p className="text-xs text-gray-400 uppercase font-bold mb-1">Payout Cycle</p>
              <p className="text-sm font-bold text-indigo-700 mt-2">Weekly</p>
              <p className="text-[11px] text-gray-400 mt-1">Net of commission & fees</p>
            </div>
          </div>
          <p className="text-xs text-indigo-400 mt-4">Questions about your account balance? Contact your ShopQR account manager.</p>
        </div>

      </main>
    </div>
  );
}
