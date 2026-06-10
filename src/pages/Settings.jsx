import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { getCurrentUser } from "../services/auth-service";
import TokensBillingTab from "../components/TokensBillingTab";
import CommunicationsSettingsTab from "../components/CommunicationsSettingsTab";

export default function Settings() {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  // MPesa Test State
  const [showMpesaTest, setShowMpesaTest] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [isTestingMpesa, setIsTestingMpesa] = useState(false);

  // Logo upload state
  const [logoFile,    setLogoFile]    = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef(null);
  
  // Active Tab Navigation
  const [activeSettingsTab, setActiveSettingsTab] = useState("general");

  // Dynamic Operating Hours State
  const [isAlwaysOpen, setIsAlwaysOpen] = useState(false);
  const [schedule, setSchedule] = useState({
    monday: { open: "08:00", close: "18:00", closed: false },
    tuesday: { open: "08:00", close: "18:00", closed: false },
    wednesday: { open: "08:00", close: "18:00", closed: false },
    thuesday: { open: "08:00", close: "18:00", closed: false },
    friday: { open: "08:00", close: "18:00", closed: false },
    saturday: { open: "08:00", close: "18:00", closed: false },
    sunday: { open: "08:00", close: "18:00", closed: true }
  });

  // KYC States & Wizard step
  const [kycStep, setKycStep] = useState(1);
  const [kycData, setKycData] = useState({
    owner_full_name: "",
    owner_phone: "",
    owner_email: "",
    owner_national_id: "",
    owner_dob: "",
    id_front_url: "",
    id_back_url: "",
    passport_photo_url: "",
    mpesa_phone: "",
    mpesa_account_name: "",
    bank_name: "",
    bank_account_no: "",
    bank_account_name: "",
    legal_business_name: "",
    business_type: "individual",
    business_reg_number: "",
    kra_pin: "",
    director_id_url: "",
    business_permit_url: "",
    kra_cert_url: "",
    county_city: "",
    physical_address: "",
    google_maps_pin: "",
    store_type: "physical",
    verification_status: "tier1"
  });

  const [kycFiles, setKycFiles] = useState({
    id_front: null,
    id_back: null,
    passport_photo: null,
    business_permit: null,
    kra_cert: null
  });
  
  const [agreeTerms, setAgreeTerms] = useState(false);

  const navigate = useNavigate();
  const user = getCurrentUser();
  const SHOP_ID = user?.shop_id || sessionStorage.getItem('active_shop_id') || null;

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    // 1. Fetch shop profile
    const { data: shopData } = await supabase
      .from("shops")
      .select("*, id:shop_id")
      .eq("shop_id", SHOP_ID)
      .single();

    if (shopData) {
      setShop(shopData);

      // Load schedule configuration
      if (shopData.operating_hours) {
        if (shopData.operating_hours.always_open) {
          setIsAlwaysOpen(true);
        } else {
          setIsAlwaysOpen(false);
          setSchedule(prev => ({
             ...prev,
             ...shopData.operating_hours
          }));
        }
      }

      // 2. Fetch associated KYC details if any
      const { data: kyc } = await supabase
        .from("shop_kyc")
        .select("*")
        .eq("shop_id", shopData.id)
        .maybeSingle();
        
      if (kyc) {
        setKycData(kyc);
        if (kyc.accepted_terms) setAgreeTerms(true);
      }
    }
    setLoading(false);
  };

  const uploadKycDocument = async (file, prefix) => {
    if (!file) return null;
    try {
      const ext = file.name.split(".").pop();
      const path = `${SHOP_ID}/${prefix}-${Date.now()}.${ext}`;
      
      const { error: upErr } = await supabase.storage
        .from("shop-documents")
        .upload(path, file, { upsert: true });
        
      if (upErr) throw upErr;
      
      const { data: urlData } = supabase.storage.from("shop-documents").getPublicUrl(path);
      return urlData?.publicUrl || path;
    } catch (err) {
      console.error("KYC document upload failed:", err);
      throw new Error(`Failed to upload ${prefix}: ${err.message}`);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);

    // 1. Upload logo if pending
    let logoUrl = shop.logo_url || null;
    if (logoFile) {
      setUploadingLogo(true);
      try {
        const ext  = logoFile.name.split(".").pop();
        const path = `${SHOP_ID}/logo-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("shop-logos").upload(path, logoFile, { upsert: true });
        if (upErr) throw upErr;

        const { data: urlData } = supabase.storage.from("shop-logos").getPublicUrl(path);
        logoUrl = urlData?.publicUrl || logoUrl;
        setLogoFile(null);
        setLogoPreview(null);
      } catch (err) {
        alert("Logo upload failed: " + err.message + ". Please ensure your image is under 2MB.");
      }
      setUploadingLogo(false);
    }

    // 2. Upload KYC documents if pending
    let kycDocUrls = { ...kycData };
    try {
      if (kycFiles.id_front) {
        kycDocUrls.id_front_url = await uploadKycDocument(kycFiles.id_front, "id-front");
      }
      if (kycFiles.id_back) {
        kycDocUrls.id_back_url = await uploadKycDocument(kycFiles.id_back, "id-back");
      }
      if (kycFiles.passport_photo) {
        kycDocUrls.passport_photo_url = await uploadKycDocument(kycFiles.passport_photo, "passport-photo");
      }
      if (kycFiles.business_permit) {
        kycDocUrls.business_permit_url = await uploadKycDocument(kycFiles.business_permit, "permit");
      }
      if (kycFiles.kra_cert) {
        kycDocUrls.kra_cert_url = await uploadKycDocument(kycFiles.kra_cert, "kra");
      }
    } catch (uploadErr) {
      alert(uploadErr.message);
      setSaving(false);
      return;
    }

    // 3. Serialize Operating Hours
    const operatingHoursPayload = isAlwaysOpen 
      ? { always_open: true } 
      : schedule;

    // 4. Update Shops Settings
    const { error: shopError } = await supabase.from("shops").update({
      name: shop.name,
      description: shop.description,
      whatsapp_number: shop.whatsapp_number,
      phone: shop.phone || null,
      payment_mode: shop.payment_mode,
      address: shop.address,
      industry_type: shop.industry_type,
      delivery_fee_fixed: shop.delivery_fee_fixed,
      min_order_value: shop.min_order_value,
      is_open: shop.is_open,
      slug: shop.slug,
      fulfillment_settings: shop.fulfillment_settings,
      mpesa_shortcode: shop.mpesa_shortcode || null,
      mpesa_till_number: shop.mpesa_till_number || null,
      mpesa_passkey: shop.mpesa_passkey || null,
      logo_url: logoUrl || null,
      operating_hours: operatingHoursPayload,
      kyc_completed: agreeTerms // Mark completed on legal terms signature
    }).eq("shop_id", SHOP_ID);

    if (shopError) {
      setSaving(false);
      setMessage("Error updating shop settings: " + shopError.message);
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    // 5. Upsert KYC Table Row
    const kycPayload = {
      shop_id: shop.id,
      owner_full_name: kycData.owner_full_name || null,
      owner_phone: kycData.owner_phone || null,
      owner_email: kycData.owner_email || null,
      owner_national_id: kycData.owner_national_id || null,
      owner_dob: kycData.owner_dob || null,
      id_front_url: kycDocUrls.id_front_url || null,
      id_back_url: kycDocUrls.id_back_url || null,
      passport_photo_url: kycDocUrls.passport_photo_url || null,
      mpesa_phone: kycData.mpesa_phone || null,
      mpesa_account_name: kycData.mpesa_account_name || null,
      bank_name: kycData.bank_name || null,
      bank_account_no: kycData.bank_account_no || null,
      bank_account_name: kycData.bank_account_name || null,
      legal_business_name: kycData.legal_business_name || null,
      business_type: kycData.business_type || "individual",
      business_reg_number: kycData.business_reg_number || null,
      kra_pin: kycData.kra_pin || null,
      business_permit_url: kycDocUrls.business_permit_url || null,
      kra_cert_url: kycDocUrls.kra_cert_url || null,
      county_city: kycData.county_city || null,
      physical_address: kycData.physical_address || null,
      google_maps_pin: kycData.google_maps_pin || null,
      store_type: kycData.store_type || "physical",
      accepted_terms: agreeTerms,
      submitted_at: new Date().toISOString()
    };

    if (kycData.owner_full_name || kycData.legal_business_name) {
      const { error: kycError } = await supabase
        .from("shop_kyc")
        .upsert(kycPayload, { onConflict: "shop_id" });

      if (kycError) {
        console.warn("KYC Upsert failure:", kycError.message);
      }
    }

    setSaving(false);
    setMessage("Settings updated successfully!");
    setTimeout(() => setMessage(null), 3000);
    fetchSettings();
  };

  const handleTestMpesa = async (e) => {
    e.preventDefault();
    setIsTestingMpesa(true);
    try {
      const response = await supabase.functions.invoke('mpesa-stk-push', {
        body: {
          order_id: `TEST-${Date.now()}`,
          phone: testPhone,
          amount: 1, // 1 KES test via Sandbox
          shop_id: SHOP_ID,
          is_b2b: false
        }
      });
      
      if (response.error) throw new Error(response.error.message || "Failed to trigger STK");
      
      setMessage("✅ STK Push sent! Check your phone.");
      setShowMpesaTest(false);
    } catch (err) {
      alert("Test failed: " + err.message + "\n\nVerify your Shortcode, Passkey, and Environment variables.");
    } finally {
      setIsTestingMpesa(false);
    }
  };

  const kycProgress = useMemo(() => {
    let score = 0;
    if (kycData?.owner_full_name) score += 10;
    if (kycData?.owner_national_id) score += 10;
    if (kycFiles?.id_front || kycData?.id_front_url) score += 15;
    if (kycFiles?.id_back || kycData?.id_back_url) score += 10;
    if (kycFiles?.passport_photo || kycData?.passport_photo_url) score += 10;
    
    if (kycData?.legal_business_name) score += 10;
    if (kycData?.kra_pin) score += 10;
    if (kycFiles?.business_permit || kycData?.business_permit_url) score += 15;
    
    if (kycData?.bank_account_no || kycData?.mpesa_phone) score += 10;
    return Math.min(100, score);
  }, [kycData, kycFiles]);

  const renderKycUploadSlot = (fieldKey, label, description, fileType = "image/*,application/pdf") => {
    const isSelected = !!kycFiles[fieldKey];
    const isUploaded = !!kycData[`${fieldKey}_url`];
    
    return (
      <div className="border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 rounded-2xl p-4 text-center transition flex flex-col items-center justify-center min-h-[140px] group relative">
        <input
          type="file"
          accept={fileType}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              setKycFiles(prev => ({ ...prev, [fieldKey]: file }));
            }
          }}
        />
        {isSelected ? (
          <div className="space-y-1 z-20 pointer-events-none">
            <span className="text-2xl">📎</span>
            <p className="text-xs font-black text-green-700 uppercase tracking-wider">{kycFiles[fieldKey].name}</p>
            <p className="text-[10px] text-green-500 font-medium">Ready to upload (save to commit)</p>
          </div>
        ) : isUploaded ? (
          <div className="space-y-1 z-20 pointer-events-none">
            <span className="text-2xl text-emerald-500 font-bold">✓</span>
            <p className="text-xs font-black text-slate-800 uppercase tracking-wider">{label} Secured</p>
            <p className="text-[10px] text-emerald-600 font-medium">Document safely uploaded and verified</p>
          </div>
        ) : (
          <div className="space-y-1 pointer-events-none">
            <span className="text-2xl group-hover:scale-110 transition-transform block">📤</span>
            <p className="text-xs font-black text-slate-800 uppercase tracking-wider">{label}</p>
            <p className="text-[10px] text-slate-400 mt-1">{description}</p>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-green-600 font-bold">Syncing Profile...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 overflow-x-hidden">
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
           <h1 className="text-xl font-bold text-gray-900">Shop Settings</h1>
           <button onClick={() => navigate('/a')} className="text-xs font-bold text-gray-400 hover:text-gray-600 transition uppercase tracking-widest">Back to Dashboard</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6 overflow-hidden">
        <form onSubmit={handleUpdate} className="space-y-6">
               {/* ── Appearance Shortcut ── */}
            <Link
              to="/a/appearance"
              className="flex items-center justify-between bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl px-6 py-4 border border-indigo-100 hover:border-indigo-300 transition group"
            >
              <div>
                <p className="text-sm font-black text-indigo-800">🎨 Customise Store Appearance</p>
                <p className="text-xs text-indigo-500 mt-0.5">Logo, colours, fonts, hero text &amp; page layout</p>
              </div>
              <svg className="w-5 h-5 text-indigo-300 group-hover:text-indigo-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Tabs Navigation */}
            <div className="flex flex-wrap border-b border-slate-200 bg-white p-2 rounded-2xl shadow-sm gap-1 sm:gap-0">
              <button
                type="button"
                onClick={() => setActiveSettingsTab("general")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer select-none ${
                  activeSettingsTab === "general"
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                }`}
              >
                ⚙️ General Profile
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsTab("hours")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer select-none ${
                  activeSettingsTab === "hours"
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                }`}
              >
                ⏰ Operating Hours
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsTab("kyc")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer select-none ${
                  activeSettingsTab === "kyc"
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                }`}
              >
                🛡️ KYC Compliance
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsTab("billing")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer select-none ${
                  activeSettingsTab === "billing"
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                }`}
              >
                🪙 Tokens & Billing
              </button>
              <button
                type="button"
                onClick={() => setActiveSettingsTab("communications")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer select-none ${
                  activeSettingsTab === "communications"
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                }`}
              >
                📡 Communications
              </button>
            </div>

            {/* Tab Panel: General Profile */}
            {activeSettingsTab === "general" && (
              <div className="space-y-6 animate-fade-in">
                {/* Logo Upload */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h2 className="text-sm font-black text-green-600 uppercase tracking-widest mb-5 border-b border-slate-50 pb-4">Shop Logo</h2>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                    <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {logoPreview || shop?.logo_url ? (
                        <img src={logoPreview || shop.logo_url} alt="Logo" className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <span className="text-3xl">{shop?.name?.charAt(0) || "🏪"}</span>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-sm text-gray-600">Appears on your public shop profile hero banner.</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">JPG, PNG, WEBP, SVG — max 2MB</p>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => logoInputRef.current?.click()} className="bg-green-50 text-green-700 border border-green-200 text-xs font-black px-4 py-2 rounded-xl hover:bg-green-100 transition uppercase tracking-widest cursor-pointer">
                          {logoFile ? "Change" : "Upload Logo"}
                        </button>
                        {(shop?.logo_url || logoFile) && (
                          <button type="button" onClick={() => { setLogoFile(null); setLogoPreview(null); setShop({...shop, logo_url: null}); }} className="bg-red-50 text-red-400 border border-red-100 text-xs font-black px-4 py-2 rounded-xl hover:bg-red-100 transition uppercase tracking-widest cursor-pointer">Remove</button>
                        )}
                      </div>
                      {logoFile && <p className="text-xs text-green-600 font-bold">📎 {logoFile.name} — will upload on save</p>}
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files[0];
                          if (!f) return;
                          if (f.size > 2 * 1024 * 1024) { alert("Logo must be under 2MB"); return; }
                          setLogoFile(f);
                          setLogoPreview(URL.createObjectURL(f));
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Basic Identity */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                  <h2 className="text-sm font-black text-green-600 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Classic Profile</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Shop Name</label>
                      <input 
                        type="text" value={shop.name || ""} 
                        onChange={e => setShop({...shop, name: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-green-600 focus:bg-white transition font-medium text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">WhatsApp Number</label>
                      <input 
                        type="text" value={shop.whatsapp_number || ""} 
                        onChange={e => setShop({...shop, whatsapp_number: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-green-600 focus:bg-white transition font-medium text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">General Phone Number</label>
                      <input 
                        type="text" value={shop.phone || ""} 
                        onChange={e => setShop({...shop, phone: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-green-600 focus:bg-white transition font-medium text-gray-900"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Description</label>
                      <textarea 
                        value={shop.description || ""} 
                        onChange={e => setShop({...shop, description: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-green-600 focus:bg-white transition h-24 font-medium text-gray-900"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Public URL Slug (Instagram/TikTok Link)</label>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <span className="text-xs font-mono text-gray-400 break-all shrink-0 max-w-full sm:max-w-[200px] truncate">{window.location.origin}/s/</span>
                        <input 
                          type="text" 
                          value={shop.slug || ""} 
                          onChange={e => setShop({...shop, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')})}
                          placeholder="your-shop-name"
                          className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-green-600 focus:bg-white transition font-bold text-gray-900 min-w-0"
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-wide">
                        This is the link you put in your Instagram or TikTok bio. Changing this will update your public identity.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fulfillment Options */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                  <h2 className="text-sm font-black text-green-600 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Fulfillment Options</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div>
                        <p className="text-sm font-bold text-gray-800">🏠 In-Store Pickup / Dine-In</p>
                        <p className="text-[10px] text-gray-500 uppercase font-medium">Free — Order is consumed or collected at the shop</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={shop?.fulfillment_settings?.accepts_pickup || false} 
                        onChange={e => {
                          const settings = shop.fulfillment_settings || {};
                          setShop({...shop, fulfillment_settings: {...settings, accepts_pickup: e.target.checked, accepts_dine_in: e.target.checked}});
                        }}
                        className="w-5 h-5 accent-green-600 rounded cursor-pointer"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div>
                        <p className="text-sm font-bold text-gray-800">🛍️ Leave with Items (Takeaway)</p>
                        <p className="text-[10px] text-gray-500 uppercase font-medium">Free — Digital receipt for takeaway items</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={shop?.fulfillment_settings?.accepts_leave_with_items || false} 
                        onChange={e => {
                          const settings = shop.fulfillment_settings || {};
                          setShop({...shop, fulfillment_settings: {...settings, accepts_leave_with_items: e.target.checked}});
                        }}
                        className="w-5 h-5 accent-green-600 rounded cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div>
                        <p className="text-sm font-bold text-gray-800">🚗 Home Delivery</p>
                        <p className="text-[10px] text-gray-500 uppercase font-medium">Paid — Customers provide address / Maps pin</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={shop?.fulfillment_settings?.accepts_delivery || false} 
                        onChange={e => {
                          const settings = shop.fulfillment_settings || {};
                          setShop({...shop, fulfillment_settings: {...settings, accepts_delivery: e.target.checked}});
                        }}
                        className="w-5 h-5 accent-green-600 rounded cursor-pointer"
                      />
                    </div>

                    {shop?.fulfillment_settings?.accepts_delivery && (
                      <div className="pl-8 border-l-2 border-slate-100 mt-2 space-y-4 animate-fade-in">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Delivery Fee (KSh)</label>
                          <input 
                            type="number" 
                            value={shop.delivery_fee_fixed || 0} 
                            onChange={e => setShop({...shop, delivery_fee_fixed: Number(e.target.value)})}
                            className="w-full max-w-[200px] bg-white border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-green-600 font-bold text-gray-900"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div>
                        <p className="text-sm font-bold text-gray-800">📦 Pickup Point (Depot)</p>
                        <p className="text-[10px] text-gray-500 uppercase font-medium">Paid — Items sent to a specific collection center</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={shop?.fulfillment_settings?.accepts_pickup_point || false} 
                        onChange={e => {
                          const settings = shop.fulfillment_settings || {};
                          setShop({...shop, fulfillment_settings: {...settings, accepts_pickup_point: e.target.checked}});
                        }}
                        className="w-5 h-5 accent-green-600 rounded cursor-pointer"
                      />
                    </div>

                    {shop?.fulfillment_settings?.accepts_pickup_point && (
                      <div className="pl-8 border-l-2 border-slate-100 mt-2 space-y-4 animate-fade-in">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Pickup Point Fee (KSh)</label>
                          <input 
                            type="number" 
                            value={shop?.fulfillment_settings?.pickup_point_fee || 0} 
                            onChange={e => {
                              const settings = shop.fulfillment_settings || {};
                              setShop({...shop, fulfillment_settings: {...settings, pickup_point_fee: Number(e.target.value)}});
                            }}
                            className="w-full max-w-[200px] bg-white border border-slate-200 rounded-lg px-4 py-2 outline-none focus:border-green-600 font-bold text-gray-900"
                          />
                        </div>

                        {/* Configured Pickup spots */}
                        <div className="space-y-3">
                          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                            Configure Collection Spots / Depots
                          </label>
                          
                          <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                            {(shop?.fulfillment_settings?.pickup_points || []).map((spot, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-200/60 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800">
                                <span>📍 {spot}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const points = [...(shop?.fulfillment_settings?.pickup_points || [])];
                                    points.splice(idx, 1);
                                    setShop({
                                      ...shop,
                                      fulfillment_settings: {
                                        ...shop.fulfillment_settings,
                                        pickup_points: points
                                      }
                                    });
                                  }}
                                  className="text-red-500 hover:text-red-700 font-bold transition text-[10px] uppercase tracking-wider bg-transparent border-0 cursor-pointer"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                            {(!shop?.fulfillment_settings?.pickup_points || shop.fulfillment_settings.pickup_points.length === 0) && (
                              <p className="text-xs text-slate-400 italic">No pickup spots added yet. Customers won't be able to select a depot checkout.</p>
                            )}
                          </div>
                          
                          {/* Add Custom Spot */}
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Type custom spot (e.g. Eldoret Main Depot)..."
                              id="custom-spot-input"
                              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-green-600 text-gray-900"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const val = e.target.value.trim();
                                  if (val) {
                                    const currentPoints = shop?.fulfillment_settings?.pickup_points || [];
                                    if (!currentPoints.includes(val)) {
                                      setShop({
                                        ...shop,
                                        fulfillment_settings: {
                                          ...shop.fulfillment_settings,
                                          pickup_points: [...currentPoints, val]
                                        }
                                      });
                                    }
                                    e.target.value = "";
                                  }
                                }
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const input = document.getElementById('custom-spot-input');
                                const val = input?.value.trim();
                                if (val) {
                                  const currentPoints = shop?.fulfillment_settings?.pickup_points || [];
                                  if (!currentPoints.includes(val)) {
                                    setShop({
                                      ...shop,
                                      fulfillment_settings: {
                                        ...shop.fulfillment_settings,
                                        pickup_points: [...currentPoints, val]
                                      }
                                    });
                                  }
                                  input.value = "";
                                }
                              }}
                              className="bg-green-50 text-green-700 border border-green-200 text-[10px] font-black px-4 py-2.5 rounded-xl hover:bg-green-100 transition uppercase tracking-widest cursor-pointer"
                            >
                              + Custom
                            </button>
                          </div>

                          {/* Select from platform spots */}
                          <div className="flex items-center gap-2">
                            <select
                              id="platform-spot-select"
                              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-green-600 text-gray-900 cursor-pointer"
                            >
                              <option value="">-- Choose Platform Spot --</option>
                              <option value="Nairobi CBD (Archives)">Nairobi CBD (Archives)</option>
                              <option value="Nairobi CBD (River Road)">Nairobi CBD (River Road)</option>
                              <option value="Westlands Depot">Westlands Depot</option>
                              <option value="Garden City Depot">Garden City Depot</option>
                              <option value="Mombasa Depot">Mombasa Depot</option>
                              <option value="Kisumu Depot">Kisumu Depot</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => {
                                const select = document.getElementById('platform-spot-select');
                                const val = select?.value;
                                if (val) {
                                  const currentPoints = shop?.fulfillment_settings?.pickup_points || [];
                                  if (!currentPoints.includes(val)) {
                                    setShop({
                                      ...shop,
                                      fulfillment_settings: {
                                        ...shop.fulfillment_settings,
                                        pickup_points: [...currentPoints, val]
                                      }
                                    });
                                  }
                                  select.value = "";
                                }
                              }}
                              className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-black px-4 py-2.5 rounded-xl hover:bg-indigo-100 transition uppercase tracking-widest cursor-pointer whitespace-nowrap"
                            >
                              + Platform
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Operational Logistics */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                  <h2 className="text-sm font-black text-green-600 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Logistics & Payments</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Industry Type</label>
                      <select 
                        value={shop.industry_type || "retail"} 
                        onChange={e => setShop({...shop, industry_type: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-green-600 focus:bg-white transition font-medium text-gray-900"
                      >
                        <option value="retail">Retail/Merchandise</option>
                        <option value="food">Gastro/Kitchen</option>
                        <option value="services">Services/Booking</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Payment Mode</label>
                      <select 
                        value={shop.payment_mode || "manual"} 
                        onChange={e => setShop({...shop, payment_mode: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-green-600 focus:bg-white transition font-medium text-gray-900"
                      >
                        <option value="manual">Manual Checkout</option>
                        <option value="stk">M-Pesa STK Push</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Local Delivery Fee (KSh)</label>
                      <input 
                        type="number" value={shop.delivery_fee_fixed || 0} 
                        onChange={e => setShop({...shop, delivery_fee_fixed: Number(e.target.value)})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-green-600 focus:bg-white transition font-medium text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Minimum Order (KSh)</label>
                      <input 
                        type="number" value={shop.min_order_value || 0} 
                        onChange={e => setShop({...shop, min_order_value: Number(e.target.value)})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-green-600 focus:bg-white transition font-medium text-gray-900"
                      />
                    </div>
                  </div>
                </div>

                {/* M-Pesa Payment Credentials */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6 border-b border-slate-50 pb-4">
                    <h2 className="text-sm font-black text-green-600 uppercase tracking-widest">M-Pesa Credentials</h2>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                      shop.mpesa_shortcode && shop.mpesa_passkey
                        ? 'bg-green-50 text-green-700'
                        : 'bg-amber-50 text-amber-600'
                    }`}>
                      {shop.mpesa_shortcode && shop.mpesa_passkey ? '✅ Configured' : '⚠️ Not Set'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                    Enter your M-Pesa Paybill or Till number and the Passkey provided by Safaricom. These are used to trigger STK push payments directly to your shop.
                  </p>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">M-Pesa Till Number (Buy Goods)</label>
                      <input
                        type="text"
                        value={shop.mpesa_till_number || ''}
                        onChange={e => setShop({...shop, mpesa_till_number: e.target.value})}
                        placeholder="e.g. 5123456"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-green-600 focus:bg-white transition font-mono text-gray-900 tracking-wider"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">M-Pesa Paybill Shortcode</label>
                      <input
                        type="text"
                        value={shop.mpesa_shortcode || ''}
                        onChange={e => setShop({...shop, mpesa_shortcode: e.target.value})}
                        placeholder="e.g. 174379"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-green-600 focus:bg-white transition font-mono text-gray-900 tracking-wider"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Passkey (Encrypted)</label>
                      <input
                        type="password"
                        value={shop.mpesa_passkey || ''}
                        onChange={e => setShop({...shop, mpesa_passkey: e.target.value})}
                        placeholder="••••••••••••••••"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-green-600 focus:bg-white transition font-mono text-gray-900 tracking-[0.2em]"
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-[10px] text-slate-400 font-medium tracking-wide">🔒 Keys are masked and stored securely in the system.</p>
                    <button 
                      type="button"
                      onClick={() => setShowMpesaTest(true)}
                      disabled={!shop.mpesa_shortcode || !shop.mpesa_passkey}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 text-xs font-bold px-4 py-2 rounded-lg uppercase tracking-widest transition cursor-pointer"
                    >
                      Test Connection
                    </button>
                  </div>

                  <div className="mt-8 border-t border-slate-100 pt-6">
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4">Manual Payment Instructions</h3>
                    <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                      If you don't use STK push, these instructions will be shown to your customers at checkout. Specify exactly how they should pay you (e.g. "Send money to 0712345678" or "Paybill 123456 Account: YourName").
                    </p>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">C2B (Retail Customer) Payment Instructions</label>
                        <textarea 
                          value={shop?.fulfillment_settings?.c2b_payment_instructions || ""} 
                          onChange={e => {
                            const settings = shop.fulfillment_settings || {};
                            setShop({...shop, fulfillment_settings: {...settings, c2b_payment_instructions: e.target.value}});
                          }}
                          placeholder="e.g. Please use Till Number 123456 to pay. Once paid, share the confirmation message via WhatsApp."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-green-600 focus:bg-white transition h-20 font-medium text-gray-900"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">B2B (Wholesale) Payment Instructions</label>
                        <textarea 
                          value={shop?.fulfillment_settings?.b2b_payment_instructions || ""} 
                          onChange={e => {
                            const settings = shop.fulfillment_settings || {};
                            setShop({...shop, fulfillment_settings: {...settings, b2b_payment_instructions: e.target.value}});
                          }}
                          placeholder="e.g. Make a bank transfer to Equity Bank, Account 123456789. Send receipt to email@example.com."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-green-600 focus:bg-white transition h-20 font-medium text-gray-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Panel: Operating Hours */}
            {activeSettingsTab === "hours" && (
              <div className="space-y-6 animate-fade-in">
                {/* 24-Hour Economy Master Toggle */}
                <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="mr-4">
                      <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">⏰ Dynamic Operating Schedules</h2>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Configure when your shop opens and closes daily. When closed, checkout will be dynamically disabled for customer protection.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs font-bold text-slate-500 uppercase hidden sm:inline">24-Hour Economy Mode</span>
                      <button
                        type="button"
                        onClick={() => setIsAlwaysOpen(!isAlwaysOpen)}
                        className={`w-14 h-8 rounded-full transition-colors relative flex items-center p-1 cursor-pointer select-none border-none outline-none ${
                          isAlwaysOpen ? 'bg-indigo-600' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                            isAlwaysOpen ? 'translate-x-6' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {isAlwaysOpen && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl flex items-center gap-3 animate-fade-in">
                      <span className="text-2xl">🚀</span>
                      <div>
                        <p className="text-sm font-bold text-indigo-900">24/7 Always Open Economy Active</p>
                        <p className="text-xs text-indigo-700 mt-0.5">Your store is open 24 hours a day, 7 days a week. Time schedules are bypassed.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Weekly Schedule Grid */}
                {!isAlwaysOpen && (
                  <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
                    <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest border-b border-slate-50 pb-4">Weekly Time Windows</h3>
                    
                    <div className="space-y-4">
                      {[
                        { key: "monday", label: "Monday" },
                        { key: "tuesday", label: "Tuesday" },
                        { key: "wednesday", label: "Wednesday" },
                        { key: "thuesday", label: "Thursday" }, // 'thuesday' matches database key
                        { key: "friday", label: "Friday" },
                        { key: "saturday", label: "Saturday" },
                        { key: "sunday", label: "Sunday" }
                      ].map(({ key, label }) => {
                        const dayConf = schedule[key] || { open: "08:00", close: "18:00", closed: false };
                        
                        return (
                          <div
                            key={key}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl transition border ${
                              dayConf.closed 
                                ? 'bg-slate-50 border-slate-100 opacity-60' 
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {/* Day toggle */}
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={!dayConf.closed}
                                onChange={(e) => {
                                  setSchedule(prev => ({
                                    ...prev,
                                    [key]: { ...dayConf, closed: !e.target.checked }
                                  }));
                                }}
                                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                              />
                              <div>
                                <p className="text-sm font-bold text-slate-800">{label}</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                                  {dayConf.closed ? "Closed for business" : "Open for business"}
                                </p>
                              </div>
                            </div>

                            {/* Time pickers */}
                            {!dayConf.closed ? (
                              <div className="flex flex-wrap items-center gap-4 sm:gap-2">
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Open</span>
                                  <input
                                    type="time"
                                    value={dayConf.open || "08:00"}
                                    onChange={(e) => {
                                      setSchedule(prev => ({
                                        ...prev,
                                        [key]: { ...dayConf, open: e.target.value }
                                      }));
                                    }}
                                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 transition"
                                  />
                                </div>
                                <span className="text-slate-300 hidden sm:inline">—</span>
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Close</span>
                                  <input
                                    type="time"
                                    value={dayConf.close || "18:00"}
                                    onChange={(e) => {
                                      setSchedule(prev => ({
                                        ...prev,
                                        [key]: { ...dayConf, close: e.target.value }
                                      }));
                                    }}
                                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600 transition"
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-lg self-start sm:self-auto">💤 Closed all day</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab Panel: KYC Onboarding Wizard */}
            {activeSettingsTab === "kyc" && (
              <div className="space-y-6 animate-fade-in">
                {/* KYC Dynamic Compliance Telemetry */}
                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/40 relative overflow-hidden">
                  <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase bg-indigo-500/30 text-indigo-200 px-3 py-1 rounded-full tracking-widest">
                        Compliance Telemetry
                      </span>
                      <h2 className="text-2xl font-black tracking-tight mt-2">Savannah Merchant Trust Center</h2>
                      <p className="text-xs text-indigo-200/70 max-w-md leading-relaxed">
                        Complete your KYC onboarding checklist to increase your payout trust tier. Higher tiers unlock instant bank settlements and unlimited order processing limits.
                      </p>
                    </div>

                    <div className="flex items-center gap-5 bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 shrink-0">
                      {/* Trust Progress ring/bar display */}
                      <div className="text-center">
                        <div className="text-3xl font-black text-indigo-300">{kycProgress}%</div>
                        <p className="text-[9px] text-indigo-200 uppercase font-black tracking-widest mt-1">Trust Score</p>
                      </div>
                      <div className="w-[1px] h-10 bg-white/10" />
                      <div>
                        <div className="text-xs font-bold text-slate-300">Verification Level</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded tracking-wider ${
                            kycData.verification_status === "tier3" 
                              ? "bg-emerald-500/20 text-emerald-300"
                              : kycData.verification_status === "tier2"
                                ? "bg-blue-500/20 text-blue-300"
                                : "bg-amber-500/20 text-amber-300"
                          }`}>
                            {kycData.verification_status === "tier3" 
                              ? "★ Fully Verified (Tier 3)" 
                              : kycData.verification_status === "tier2"
                                ? "★ Business Verified (Tier 2)"
                                : "★ Identity Verified (Tier 1)"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Telemetry Progress Bar */}
                  <div className="mt-6 space-y-1.5 relative z-10">
                    <div className="flex justify-between items-center text-[10px] uppercase font-black text-indigo-300 tracking-wider">
                      <span>Onboarding Checklist Completion</span>
                      <span>{kycProgress}/100 PTS</span>
                    </div>
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                          kycProgress >= 70 
                            ? "from-emerald-500 to-teal-400"
                            : kycProgress >= 30 
                              ? "from-amber-500 to-orange-400"
                              : "from-red-500 to-rose-400"
                        }`}
                        style={{ width: `${kycProgress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* KYC 3-Step Wizard Navigation Timeline */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center justify-between relative overflow-x-auto scrollbar-hide">
                  {[
                    { step: 1, label: "Identity", icon: "👤" },
                    { step: 2, label: "Business", icon: "🏢" },
                    { step: 3, label: "Settlements", icon: "💳" }
                  ].map(({ step, label, icon }) => (
                    <button
                      key={step}
                      type="button"
                      onClick={() => setKycStep(step)}
                      className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition border shrink-0 cursor-pointer ${
                        kycStep === step
                          ? "bg-slate-900 border-slate-900 text-white font-bold shadow-md"
                          : kycStep > step
                            ? "bg-emerald-50 border-emerald-100 text-emerald-700 font-bold"
                            : "bg-slate-50 border-slate-100 text-slate-400"
                      }`}
                    >
                      <span className="text-sm">{icon}</span>
                      <span className="text-[10px] font-black uppercase tracking-wider">{label} (Step {step})</span>
                    </button>
                  ))}
                </div>

                {/* Wizard Panel Content */}
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                  
                  {/* STEP 1: ACCOUNT OWNER IDENTITY */}
                  {kycStep === 1 && (
                    <div className="space-y-6 animate-fade-in">
                      <div>
                        <h3 className="text-base font-black text-slate-800">Step 1: Account Owner Identity</h3>
                        <p className="text-xs text-slate-500 mt-1">Provide the legal identity of the shop owner or corporate representative.</p>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-5">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wide">Owner Full Name (Matching National ID)</label>
                          <input 
                            type="text" 
                            required
                            value={kycData.owner_full_name || ""} 
                            onChange={e => setKycData({...kycData, owner_full_name: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-600 focus:bg-white transition text-slate-900 font-medium text-sm"
                            placeholder="e.g. John Kamau Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wide">National ID / Passport Number</label>
                          <input 
                            type="text" 
                            value={kycData.owner_national_id || ""} 
                            onChange={e => setKycData({...kycData, owner_national_id: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-600 focus:bg-white transition text-slate-900 font-medium text-sm"
                            placeholder="e.g. 34567890"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wide">Date of Birth</label>
                          <input 
                            type="date" 
                            value={kycData.owner_dob || ""} 
                            onChange={e => setKycData({...kycData, owner_dob: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-600 focus:bg-white transition text-slate-900 font-medium text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wide">Contact Phone Number</label>
                          <input 
                            type="tel" 
                            value={kycData.owner_phone || ""} 
                            onChange={e => setKycData({...kycData, owner_phone: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-600 focus:bg-white transition text-slate-900 font-medium text-sm"
                            placeholder="e.g. +254 700 000000"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wide">Identity Email Address</label>
                          <input 
                            type="email" 
                            value={kycData.owner_email || ""} 
                            onChange={e => setKycData({...kycData, owner_email: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-600 focus:bg-white transition text-slate-900 font-medium text-sm"
                            placeholder="e.g. owner@shop.com"
                          />
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Required Documents</p>
                        <div className="grid sm:grid-cols-3 gap-4">
                          {renderKycUploadSlot("id_front", "National ID Front", "Upload clear PNG or JPG of ID Front")}
                          {renderKycUploadSlot("id_back", "National ID Back", "Upload clear PNG or JPG of ID Back")}
                          {renderKycUploadSlot("passport_photo", "Passport Photo", "Upload color passport photo size")}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: BUSINESS REGISTRY & LOCATION */}
                  {kycStep === 2 && (
                    <div className="space-y-6 animate-fade-in">
                      <div>
                        <h3 className="text-base font-black text-slate-800">Step 2: Business & Operations Registry</h3>
                        <p className="text-xs text-slate-500 mt-1">Provide regulatory business documents and licensing details.</p>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-5">
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wide">Legal Registered Business Name</label>
                          <input 
                            type="text" 
                            value={kycData.legal_business_name || ""} 
                            onChange={e => setKycData({...kycData, legal_business_name: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-600 focus:bg-white transition text-slate-900 font-medium text-sm"
                            placeholder="e.g. Savannah Atelier Limited"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wide">Business Structure</label>
                          <select 
                            value={kycData.business_type || "individual"} 
                            onChange={e => setKycData({...kycData, business_type: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-600 focus:bg-white transition text-slate-900 font-medium text-sm"
                          >
                            <option value="individual">Sole Proprietorship / Individual</option>
                            <option value="partnership">Partnership Entity</option>
                            <option value="company">Limited Liability Company (LLC)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wide">Business KRA PIN</label>
                          <input 
                            type="text" 
                            value={kycData.kra_pin || ""} 
                            onChange={e => setKycData({...kycData, kra_pin: e.target.value.toUpperCase()})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-600 focus:bg-white transition text-slate-900 font-medium text-sm font-mono tracking-wider"
                            placeholder="e.g. A012345678B"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wide">Business License / Registration No</label>
                          <input 
                            type="text" 
                            value={kycData.business_reg_number || ""} 
                            onChange={e => setKycData({...kycData, business_reg_number: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-600 focus:bg-white transition text-slate-900 font-medium text-sm"
                            placeholder="e.g. PVT-L8D6353"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wide">Store Deployment Type</label>
                          <select 
                            value={kycData.store_type || "physical"} 
                            onChange={e => setKycData({...kycData, store_type: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-600 focus:bg-white transition text-slate-900 font-medium text-sm"
                          >
                            <option value="physical">Physical Brick &amp; Mortar Store</option>
                            <option value="online_only">Online Only Storefront</option>
                            <option value="mobile_vendor">Mobile / Pop-Up Vendor</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2 grid sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wide">County / City</label>
                            <input 
                              type="text" 
                              value={kycData.county_city || ""} 
                              onChange={e => setKycData({...kycData, county_city: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-600 focus:bg-white transition text-slate-900 font-medium text-sm"
                              placeholder="e.g. Nairobi"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wide">Physical Address / Street Location</label>
                            <input 
                              type="text" 
                              value={kycData.physical_address || ""} 
                              onChange={e => setKycData({...kycData, physical_address: e.target.value})}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-600 focus:bg-white transition text-slate-900 font-medium text-sm"
                              placeholder="e.g. Biashara Street, Suite 5B"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Required Documents</p>
                        <div className="grid sm:grid-cols-2 gap-4">
                          {renderKycUploadSlot("business_permit", "Unified Business Permit", "County Business License (PDF or Image)", "image/*,application/pdf")}
                          {renderKycUploadSlot("kra_cert", "KRA PIN Certificate", "KRA PIN tax certificate (PDF or Image)", "image/*,application/pdf")}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: FINANCIAL SETTLEMENTS & AGREEMENT */}
                  {kycStep === 3 && (
                    <div className="space-y-6 animate-fade-in">
                      <div>
                        <h3 className="text-base font-black text-slate-800">Step 3: Settlements & Agreements</h3>
                        <p className="text-xs text-slate-500 mt-1">Configure payout settlement details and agree to terms.</p>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-5">
                        <div className="sm:col-span-2 border-b border-slate-100 pb-2">
                          <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Settlement Option A: Direct Bank Account</p>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wide">Settlement Bank Name</label>
                          <select 
                            value={kycData.bank_name || ""} 
                            onChange={e => setKycData({...kycData, bank_name: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-600 focus:bg-white transition text-slate-900 font-medium text-sm"
                          >
                            <option value="">Select Settlement Bank...</option>
                            <option value="KCB">Kenya Commercial Bank (KCB)</option>
                            <option value="Equity">Equity Bank</option>
                            <option value="Co-op">Co-operative Bank of Kenya</option>
                            <option value="NCBA">NCBA Bank</option>
                            <option value="Absa">Absa Bank Kenya</option>
                            <option value="Family">Family Bank</option>
                            <option value="DTB">Diamond Trust Bank (DTB)</option>
                            <option value="StanChart">Standard Chartered Bank</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wide">Bank Account Number</label>
                          <input 
                            type="text" 
                            value={kycData.bank_account_no || ""} 
                            onChange={e => setKycData({...kycData, bank_account_no: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-600 focus:bg-white transition text-slate-900 font-mono text-sm"
                            placeholder="e.g. 1102345678"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wide">Bank Account Holder Name (Must match owner identity)</label>
                          <input 
                            type="text" 
                            value={kycData.bank_account_name || ""} 
                            onChange={e => setKycData({...kycData, bank_account_name: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-600 focus:bg-white transition text-slate-900 font-medium text-sm"
                            placeholder="e.g. John Kamau Doe"
                          />
                        </div>

                        <div className="sm:col-span-2 border-b border-slate-100 pt-3 pb-2">
                          <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Settlement Option B: Mobile Money (M-Pesa Business)</p>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wide">M-Pesa Payout Phone Number</label>
                          <input 
                            type="tel" 
                            value={kycData.mpesa_phone || ""} 
                            onChange={e => setKycData({...kycData, mpesa_phone: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-600 focus:bg-white transition text-slate-900 font-medium text-sm"
                            placeholder="e.g. 0700000000"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wide">M-Pesa Payout Account Name</label>
                          <input 
                            type="text" 
                            value={kycData.mpesa_account_name || ""} 
                            onChange={e => setKycData({...kycData, mpesa_account_name: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-600 focus:bg-white transition text-slate-900 font-medium text-sm"
                            placeholder="e.g. John Kamau"
                          />
                        </div>
                      </div>

                      {/* Terms Compliance */}
                      <div className="border-t border-slate-100 pt-5 space-y-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Legal Sign-off</p>
                        
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-start gap-3">
                          <input 
                            type="checkbox" 
                            checked={agreeTerms} 
                            onChange={e => setAgreeTerms(e.target.checked)}
                            className="w-5 h-5 accent-slate-900 rounded cursor-pointer mt-0.5"
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-800">Agree to Merchant Terms &amp; Conditions</p>
                            <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                              I certify under penalty of law that the information provided is accurate and represents the legitimate officers and controllers of the business entity. I agree to the platform processing rules and settlement SLA policies.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* KYC Wizard Step Navigation */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                    {kycStep > 1 ? (
                      <button
                        type="button"
                        onClick={() => setKycStep(kycStep - 1)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black px-6 py-3 rounded-xl transition uppercase tracking-widest cursor-pointer select-none"
                      >
                        ← Previous Step
                      </button>
                    ) : (
                      <div />
                    )}
                    
                    {kycStep < 3 ? (
                      <button
                        type="button"
                        onClick={() => setKycStep(kycStep + 1)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black px-6 py-3 rounded-xl transition uppercase tracking-widest shadow-md hover:shadow-indigo-500/20 cursor-pointer select-none"
                      >
                        Next Step →
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={saving || !agreeTerms}
                        className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 text-xs font-black px-8 py-3 rounded-xl transition uppercase tracking-[0.15em] shadow-md hover:shadow-green-500/20 cursor-pointer select-none"
                      >
                        {saving ? 'Syncing...' : 'Submit Profile'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Global Sticky Footer (Present for quick general saves) */}
            <div className="flex flex-wrap items-center justify-between gap-3 sticky bottom-4 z-10 bg-white/80 backdrop-blur p-4 rounded-3xl shadow-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${shop.is_open ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{shop.is_open ? 'Shop is Live' : 'Shop is Closed'}</span>
                <input 
                  type="checkbox" checked={shop.is_open || false} 
                  onChange={e => setShop({...shop, is_open: e.target.checked})}
                  className="w-5 h-5 accent-green-600 rounded cursor-pointer"
                />
              </div>
              <button 
                type="submit" disabled={saving}
                className="bg-green-600 text-white font-black py-4 px-10 rounded-2xl hover:bg-green-700 transition shadow-xl hover:shadow-green-500/20 active:scale-95 disabled:opacity-50 uppercase text-xs tracking-[0.2em] cursor-pointer"
              >
                {saving ? 'Syncing...' : 'Lock Changes'}
              </button>
            </div>
           
           {message && <div className="fixed top-24 right-6 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl animate-in font-bold text-xs uppercase tracking-widest z-50 border border-slate-700">{message}</div>}
          {/* Tab Panel: Billing & Tokens */}
          {activeSettingsTab === "billing" && (
            <TokensBillingTab shopId={SHOP_ID} shop={shop} />
          )}

          {/* Tab Panel: Communications */}
          {activeSettingsTab === "communications" && (
            <CommunicationsSettingsTab shopId={SHOP_ID} />
          )}

        </form>
      </main>

      {/* M-Pesa Test Modal */}
      {showMpesaTest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm border border-slate-200">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">System Diagnostics</p>
            <h3 className="text-xl font-black mb-4 text-gray-900">Test M-Pesa STK</h3>
            <p className="text-xs text-gray-500 mb-6">Enter your phone number. We will send a 1 KES payment request to verify your credentials are working.</p>
            
            <form onSubmit={handleTestMpesa}>
               <input
                 type="tel"
                 required
                 value={testPhone}
                 onChange={e => setTestPhone(e.target.value)}
                 placeholder="07XX XXX XXX"
                 className="w-full border-2 border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-green-500 mb-6 font-mono font-bold"
               />
               <div className="grid grid-cols-2 gap-3">
                 <button disabled={isTestingMpesa} className="bg-green-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 disabled:opacity-50">
                    {isTestingMpesa ? 'Pinging...' : 'Send STK'}
                 </button>
                 <button type="button" onClick={() => setShowMpesaTest(false)} className="bg-gray-100 text-gray-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200">
                    Cancel
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

