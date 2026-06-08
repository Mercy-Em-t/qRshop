import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../services/auth-service";
import { supabase } from "../services/supabase-client";
import { getOrdersPerDay, getPopularItems } from "../services/analytics-service";
import { getSubscription } from "../services/subscription-service";
import { useConversionStats } from "../hooks/useConversionStats";
import { useVisitStats } from "../hooks/useVisitStats";
import AnalyticsChart from "../components/AnalyticsChart";
import SubscriptionStatus from "../components/SubscriptionStatus";
import OnboardingWizard from "../components/OnboardingWizard";
import UpgradeModal from "../components/UpgradeModal";
import MultiShopNoticeboard from "../components/MultiShopNoticeboard";
import AppLauncher from "../components/AppLauncher";
import ShareShopModal from "../components/ShareShopModal";
import usePlanAccess from "../hooks/usePlanAccess";

export default function Dashboard() {
  const [ordersPerDay, setOrdersPerDay] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [shop, setShop] = useState(null);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [lastCheckCount, setLastCheckCount] = useState(null);
  const [showNewOrderToast, setShowNewOrderToast] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [lockedFeatureFocus, setLockedFeatureFocus] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const planAccess = usePlanAccess();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const user = getCurrentUser();
  // Multi-shop users have shop_id = null; fall back to the active shop chosen in ShopSelection
  const shopId = user?.shop_id || sessionStorage.getItem('active_shop_id') || null;

  // Real-time conversion intelligence hook
  const { stats: convStats } = useConversionStats(shopId);
  const { stats: visitStats } = useVisitStats(shopId);

  const [merchantIdInput, setMerchantIdInput] = useState("");
  const [syncEnabledInput, setSyncEnabledInput] = useState(false);
  const [verificationTokenInput, setVerificationTokenInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingToken, setIsSavingToken] = useState(false);
  
  const [diagnostics, setDiagnostics] = useState(null);
  const [loadingDiagnostics, setLoadingDiagnostics] = useState(false);
  const [diagnosticsError, setDiagnosticsError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [setupStep, setSetupStep] = useState(null); // null | 'verify' | 'merchant'

  useEffect(() => {
    if (shop) {
      setMerchantIdInput(shop.google_merchant_id || "");
      setSyncEnabledInput(shop.google_sync_enabled || false);
      setVerificationTokenInput(shop.google_verification_token || "");
    }
  }, [shop]);

  const handleSaveVerificationToken = async () => {
    if (!verificationTokenInput.trim()) return;
    setIsSavingToken(true);
    try {
      const token = verificationTokenInput.trim();
      const { error } = await supabase
        .from('shops')
        .update({ google_verification_token: token })
        .eq('shop_id', shopId);
      if (error) throw error;
      setShop(prev => ({ ...prev, google_verification_token: token }));
      alert('Verification token saved! Google can now verify your site.');
    } catch (err) {
      alert(`Error saving token: ${err.message}`);
    } finally {
      setIsSavingToken(false);
    }
  };

  const fetchDiagnostics = async () => {
    if (!shopId) return;
    setLoadingDiagnostics(true);
    setDiagnosticsError(null);
    try {
      const res = await fetch(`/api/merchant/status?shopId=${shopId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch diagnostics.");
      }
      setDiagnostics(data);
    } catch (err) {
      console.error("Failed to fetch Google diagnostics:", err);
      setDiagnosticsError(err.message);
    } finally {
      setLoadingDiagnostics(false);
    }
  };

  useEffect(() => {
    if (showGoogleModal && shopId) {
      const activeMerchantId = shop?.google_merchant_id || sessionStorage.getItem('active_shop_google_merchant_id');
      if (activeMerchantId || merchantIdInput) {
        fetchDiagnostics();
      }
    }
  }, [showGoogleModal, shopId]);

  const handleSaveGoogleSettings = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("shops")
        .update({
          google_merchant_id: merchantIdInput,
          google_sync_enabled: syncEnabledInput
        })
        .eq("shop_id", shopId);

      if (error) throw error;
      alert("Google settings updated successfully!");
      
      setShop(prev => ({
        ...prev,
        google_merchant_id: merchantIdInput,
        google_sync_enabled: syncEnabledInput
      }));
    } catch (err) {
      console.error("Failed to save settings:", err);
      alert(`Error saving settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // One-tap master toggle — flips google_sync_enabled directly from the card
  const handleToggleGoogleSync = async (e) => {
    e.stopPropagation(); // don't open modal
    const newValue = !shop?.google_sync_enabled;
    try {
      const { error } = await supabase
        .from("shops")
        .update({ google_sync_enabled: newValue })
        .eq("shop_id", shopId);
      if (error) throw error;
      setShop(prev => ({ ...prev, google_sync_enabled: newValue }));
      setSyncEnabledInput(newValue);
    } catch (err) {
      console.error("Toggle failed:", err);
      alert(`Could not update Google sync: ${err.message}`);
    }
  };


  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(`/api/merchant/sync?shopId=${shopId}`, {
        method: "POST"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed.");
      alert(data.message || "Product sync completed successfully!");
      
      fetchDiagnostics();
      
      // Update local state with new sync metadata
      const { data: freshShop } = await supabase
        .from("shops")
        .select("google_last_sync_at, google_sync_status")
        .eq("shop_id", shopId)
        .single();
      if (freshShop) {
        setShop(prev => ({
          ...prev,
          google_last_sync_at: freshShop.google_last_sync_at,
          google_sync_status: freshShop.google_sync_status
        }));
      }
    } catch (err) {
      console.error("Sync failed:", err);
      alert(`Error syncing products: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    async function fetchAnalytics() {
      if (!shopId) {
        setLoading(false);
        return;
      }
      if (!supabase) {
        setLoading(false);
        return;
      }

      // Check Onboarding Status
      try {
        const hasSeenOnboarding = localStorage.getItem(`onboarded_${shopId}`);
        if (!hasSeenOnboarding) {
          const { count: qrCount } = await supabase.from('qrs').select('*', { count: 'exact', head: true }).eq('shop_id', shopId);
          const { count: menuCount } = await supabase.from('menu_items').select('*', { count: 'exact', head: true }).eq('shop_id', shopId);
          
          if (qrCount === 0 && menuCount === 0) {
            setShowWizard(true);
          } else {
             // If they already have data but no flag, just safely mark it
             localStorage.setItem(`onboarded_${shopId}`, "true");
          }
        }
      } catch (e) {
         console.warn("Could not fetch onboarding stats", e);
      }

      try {
        const [orders, popular, shopRes] = await Promise.all([
          getOrdersPerDay(shopId),
          getPopularItems(shopId),
          supabase.from("shops").select("*, id:shop_id").eq("shop_id", shopId).single(),
        ]);
        setOrdersPerDay(orders);
        setPopularItems(popular);
        setShop(shopRes?.data || null);
      } catch {
        // Analytics loading failed silently
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [shopId]);

  // Dedicated poll for Actionable Orders
  useEffect(() => {
    if (!shopId) return;

    const fetchPendingCount = async () => {
      if (!supabase) return;
      const { count } = await supabase
        .from("orders")
        .select('*', { count: 'exact', head: true })
        .eq("shop_id", shopId)
        .in("status", ["pending_payment", "pending", "stk_pushed"]);
      
      const newCount = count || 0;
      
      // If count increased, show toast
      if (lastCheckCount !== null && newCount > lastCheckCount) {
         setShowNewOrderToast(true);
         // Play a subtle sound if possible, or just the toast
         try { new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play(); } catch(e) {}
         setTimeout(() => setShowNewOrderToast(false), 5000);
      }
      
      setPendingOrdersCount(newCount);
      setLastCheckCount(newCount);
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 10000); // 10s poll
    return () => clearInterval(interval);
  }, [shopId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800">Shop Dashboard</h1>
            {user?.role === 'system_admin' && (
              <span className="bg-slate-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">Admin View</span>
            )}
          </div>
          {/* Desktop right-side */}
          <div className="hidden sm:flex items-center gap-4">
            <button 
              onClick={() => navigate("/shop-selection")}
              className="text-xs font-black bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition flex items-center gap-2 border border-white/10"
            >
              <span>🔄</span> Switch Shop
            </button>
            <button 
              onClick={() => setShowShareModal(true)}
              className="text-xs font-bold bg-theme-main text-white px-4 py-2 rounded-xl hover:bg-slate-900 transition flex items-center gap-2"
            >
              <span>🔗</span> Share Shop
            </button>
            {user?.system_role === 'system_admin' && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
                <p className="text-red-700 text-sm font-bold flex items-center gap-2">
                  <span>🛡️</span> SYSTEM ADMINISTRATOR MODE
                </p>
              </div>
            )}
            {user?.system_role === 'system_admin' && <AppLauncher />}
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            onClick={() => setMobileMenuOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>
        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-100 bg-white px-4 py-3 flex flex-col gap-3">
            <Link to="/a/orders" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-700">🛎 Live Orders</Link>
            <Link to="/product-manager" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-700">📋 Product Manager</Link>
            <Link to="/a/ai-brain" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-700">🧠 AI Brain</Link>
            <Link to="/a/settings" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-700">⚙️ Settings</Link>
            <button onClick={() => { logout(); navigate("/login"); }} className="text-sm font-bold text-red-500 text-left">Logout</button>
          </div>
        )}
      </header>

      <ShareShopModal 
        shop={shop} 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)} 
      />

      {showGoogleModal && (
        <div style={{ fontFamily: 'var(--font-family, Outfit)' }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Integration Hub</span>
                <h2 className="text-2xl font-black text-gray-900 mt-2">🌐 Google Shopping Hub</h2>
              </div>
              <button 
                onClick={() => setShowGoogleModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-6">

              {/* 🚀 SECTION 0: SETUP GUIDE — shown when not yet fully configured */}
              {(!shop?.google_merchant_id || !shop?.google_verification_token) && (
                <div className="border border-blue-100 rounded-2xl p-5 bg-blue-50/40">
                  <h3 className="text-sm font-bold text-blue-900 mb-1 flex items-center gap-1.5">
                    🚀 How to set up Google Shopping
                  </h3>
                  <p className="text-[11px] text-blue-700 mb-4 leading-relaxed">
                    Google requires you to create your own free Merchant Center account — we can't do this on your behalf. But once it's created, everything else is managed here.
                  </p>

                  {/* Step 1 */}
                  <div className={`flex gap-3 mb-3 p-3 rounded-xl border ${shop?.google_verification_token ? 'bg-green-50 border-green-200' : 'bg-white border-blue-100'}`}>
                    <span className={`shrink-0 w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ${shop?.google_verification_token ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'}`}>
                      {shop?.google_verification_token ? '✓' : '1'}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-800">Create your Google Merchant Center account</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Free to sign up. Use the same email as your Google Business Profile if you have one.</p>
                      <a
                        href="https://merchants.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-800 underline"
                      >
                        Open Google Merchant Center ↗
                      </a>
                    </div>
                  </div>

                  {/* Step 2 — site verification token */}
                  <div className={`flex gap-3 mb-3 p-3 rounded-xl border ${shop?.google_verification_token ? 'bg-green-50 border-green-200' : 'bg-white border-blue-100'}`}>
                    <span className={`shrink-0 w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ${shop?.google_verification_token ? 'bg-green-500 text-white' : 'bg-blue-200 text-blue-700'}`}>
                      {shop?.google_verification_token ? '✓' : '2'}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-800">Verify your website with Google</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                        In Merchant Center → <strong>Business info → Website</strong>, click <strong>"Verify your website"</strong>. Choose <strong>HTML file</strong> method. Copy the filename Google gives you (looks like <code className="bg-gray-100 px-1 rounded">googleXXXXXXXX.html</code>).
                      </p>
                      {/* Verification URL preview */}
                      {shop?.slug && (
                        <div className="mt-2 bg-slate-50 border border-slate-200 rounded-lg p-2">
                          <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Your verification URL will be:</p>
                          <p className="text-[10px] font-mono text-gray-700 break-all">
                            https://www.tmsavannah.com/s/{shop.slug}/google<span className="text-blue-600">[your-token]</span>.html
                          </p>
                        </div>
                      )}
                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          placeholder="Paste token e.g. abc123xyz (just the letters, not the full filename)"
                          value={verificationTokenInput}
                          onChange={(e) => setVerificationTokenInput(e.target.value.replace(/google|\.html/gi, '').trim())}
                          className="flex-1 text-[10px] bg-white border border-gray-200 px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                        />
                        <button
                          onClick={handleSaveVerificationToken}
                          disabled={isSavingToken || !verificationTokenInput.trim()}
                          className="shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-[10px] font-bold px-3 py-2 rounded-lg transition cursor-pointer"
                        >
                          {isSavingToken ? '...' : 'Save'}
                        </button>
                      </div>
                      {shop?.google_verification_token && (
                        <p className="text-[10px] text-green-600 font-bold mt-1">✓ Token saved — Google can verify your site</p>
                      )}
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className={`flex gap-3 mb-3 p-3 rounded-xl border ${shop?.google_merchant_id ? 'bg-green-50 border-green-200' : 'bg-white border-blue-100'}`}>
                    <span className={`shrink-0 w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ${shop?.google_merchant_id ? 'bg-green-500 text-white' : 'bg-blue-200 text-blue-700'}`}>
                      {shop?.google_merchant_id ? '✓' : '3'}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-800">Enter your Merchant ID below</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">Found in Merchant Center → top-right corner under your account name. It's a 9–10 digit number.</p>
                      {shop?.google_merchant_id && (
                        <p className="text-[10px] text-green-600 font-bold mt-1">✓ Merchant ID saved: {shop.google_merchant_id}</p>
                      )}
                    </div>
                  </div>

                  {/* Step 4 — invite service account */}
                  <div className={`flex gap-3 p-3 rounded-xl border ${shop?.google_merchant_id ? 'bg-green-50 border-green-200' : 'bg-white border-blue-100'}`}>
                    <span className={`shrink-0 w-6 h-6 rounded-full text-xs font-black flex items-center justify-center ${shop?.google_merchant_id ? 'bg-green-500 text-white' : 'bg-blue-200 text-blue-700'}`}>
                      {shop?.google_merchant_id ? '✓' : '4'}
                    </span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-800">Invite Platform Service Account</p>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                        To allow the platform to update your catalog, go to Merchant Center → <strong>Settings & Tools (Gear icon) → People & access</strong>, click <strong>Add User</strong>, and invite the platform email below as an <strong>Admin</strong>:
                      </p>
                      <div className="mt-2 flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1.5 font-mono text-[9px] text-gray-700">
                        <span className="flex-1 truncate">tmsavannah-googlemerchantsync@tm-savannahshop.iam.gserviceaccount.com</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText('tmsavannah-googlemerchantsync@tm-savannahshop.iam.gserviceaccount.com');
                            alert('Copied to clipboard!');
                          }}
                          className="shrink-0 bg-gray-200 hover:bg-gray-300 text-[9px] font-bold px-2 py-0.5 rounded cursor-pointer transition"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}


              {/* ✅ All set banner — shown once fully configured */}
              {shop?.google_merchant_id && shop?.google_verification_token && (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="text-xs font-bold text-green-800">Google Shopping fully configured</p>
                    <p className="text-[10px] text-green-600">Site verified · Merchant ID connected · Products syncing</p>
                  </div>
                </div>
              )}

              {/* ⚙️ SECTION 1: SETTINGS CONFIGURATION */}
              <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/30">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5">
                  <span>⚙️</span> Configuration Settings
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Google Merchant ID</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 509284102"
                      value={merchantIdInput}
                      onChange={(e) => setMerchantIdInput(e.target.value)}
                      className="w-full bg-white border border-gray-200 text-sm px-4 py-2.5 rounded-xl text-gray-700 focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-bold text-gray-700">Enable Automated Sync</label>
                      <p className="text-[10px] text-gray-400">Pushes catalogue changes to Google instantly</p>
                    </div>
                    <input 
                      type="checkbox"
                      checked={syncEnabledInput}
                      onChange={(e) => setSyncEnabledInput(e.target.checked)}
                      className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={handleSaveGoogleSettings}
                    disabled={isSaving}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? "Saving Settings..." : "Save Settings"}
                  </button>
                </div>
              </div>

              {/* 🔄 SECTION 2: SYNCHRONISATION */}
              <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <span>🔄</span> Sync Catalogue
                  </h3>
                  <button
                    onClick={handleSyncNow}
                    disabled={isSyncing || !shop?.google_merchant_id}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSyncing ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Syncing...
                      </>
                    ) : (
                      "Sync Now"
                    )}
                  </button>
                </div>

                <div className="text-xs text-gray-500 space-y-1.5">
                  <p>
                    <strong>Last Sync Run:</strong>{" "}
                    {shop?.google_last_sync_at 
                      ? new Date(shop.google_last_sync_at).toLocaleString() 
                      : "Never synced"}
                  </p>
                  <p className="bg-white border border-gray-100 p-2.5 rounded-lg text-[11px] font-mono text-gray-600 break-words">
                    <strong>Status:</strong> {shop?.google_sync_status || "Awaiting initial sync."}
                  </p>
                </div>
              </div>

              {/* 📊 SECTION 3: LIVE DIAGNOSTICS */}
              <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <span>📊</span> Google Diagnostics
                  </h3>
                  {shop?.google_merchant_id && (
                    <button 
                      onClick={fetchDiagnostics}
                      disabled={loadingDiagnostics}
                      className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 transition"
                    >
                      {loadingDiagnostics ? "Loading..." : "Refresh Status"}
                    </button>
                  )}
                </div>

                {!shop?.google_merchant_id ? (
                  <p className="text-xs text-gray-400 italic text-center py-4">
                    Enter and save your Google Merchant ID above to query live product diagnostics.
                  </p>
                ) : loadingDiagnostics ? (
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-[11px] text-gray-400 font-medium">Fetching Merchant Center status...</p>
                  </div>
                ) : diagnosticsError ? (
                  <div className="bg-red-50 text-red-800 text-xs p-3 rounded-xl border border-red-100 text-center">
                    ⚠️ {diagnosticsError}
                  </div>
                ) : diagnostics ? (
                  <div className="space-y-4">
                    {/* Diagnostic metrics */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-green-50 border border-green-100 p-3 rounded-xl">
                        <p className="text-[9px] font-black uppercase text-green-700 mb-0.5">Approved</p>
                        <p className="text-lg font-black text-green-700">{diagnostics.approved}</p>
                      </div>
                      <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl">
                        <p className="text-[9px] font-black uppercase text-amber-700 mb-0.5">Pending</p>
                        <p className="text-lg font-black text-amber-700">{diagnostics.pending}</p>
                      </div>
                      <div className="bg-red-50 border border-red-100 p-3 rounded-xl">
                        <p className="text-[9px] font-black uppercase text-red-700 mb-0.5">Rejected</p>
                        <p className="text-lg font-black text-red-700">{diagnostics.disapproved}</p>
                      </div>
                    </div>

                    {/* Disapproval issues list */}
                    {diagnostics.issues && diagnostics.issues.length > 0 ? (
                      <div className="space-y-2.5">
                        <p className="text-xs font-bold text-gray-700">Flagged Catalog Issues:</p>
                        {diagnostics.issues.map((issue, idx) => (
                          <div key={idx} className="bg-red-50/50 text-red-800 text-[11px] p-3.5 rounded-xl border border-red-100/50 flex flex-col gap-1.5">
                            <div className="flex justify-between font-bold">
                              <span className="flex items-center gap-1">⚠️ {issue.description}</span>
                              <span className="bg-red-100 px-1.5 py-0.5 rounded text-[9px]">{issue.affectedItems} items</span>
                            </div>
                            <p className="text-gray-500 leading-normal">{issue.detail}</p>
                            {issue.resolution && (
                              <p className="text-[10px] text-green-700 font-semibold bg-green-50 border border-green-100/50 px-2 py-1 rounded">
                                💡 Fix: {issue.resolution}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-100 text-green-700 text-xs p-3.5 rounded-xl text-center font-bold">
                        🎉 All synchronized products are fully approved on Google Shopping!
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic text-center py-4">
                    Diagnostics data not yet loaded. Click "Refresh Status" to query.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowGoogleModal(false)}
                className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transition cursor-pointer text-sm"
              >
                Close Hub
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Order Toast */}
      {showNewOrderToast && (
        <div className="fixed top-20 right-4 z-[100] animate-bounce">
          <Link 
            to="/a/orders"
            className="bg-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-green-400"
            onClick={() => setShowNewOrderToast(false)}
          >
            <span className="text-2xl">🔔</span>
            <div>
              <p className="font-bold text-sm">New Order Received!</p>
              <p className="text-[10px] opacity-90 uppercase font-black tracking-widest">Tap to process</p>
            </div>
          </Link>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {showWizard && (
          <OnboardingWizard 
            shopId={shopId} 
            onComplete={() => setShowWizard(false)} 
          />
        )}
        
        {lockedFeatureFocus && (
          <UpgradeModal 
             featureName={lockedFeatureFocus} 
             onClose={() => setLockedFeatureFocus(null)} 
          />
        )}
        
        {/* Subscription Status */}
        <div className="mb-6">
          <SubscriptionStatus shop={shop} />
        </div>

        {/* Action Alert Banner */}
        {pendingOrdersCount > 0 && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-sm flex items-center justify-between animate-pulse">
            <div>
              <h3 className="text-red-800 font-bold text-lg flex items-center gap-2">
                <span className="text-2xl">🔔</span> Action Required
              </h3>
              <p className="text-red-700 text-sm mt-1">
                You have {pendingOrdersCount} {pendingOrdersCount === 1 ? 'order' : 'orders'} waiting for your approval!
              </p>
            </div>
            <Link 
              to="/a/orders"
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-700 transition"
            >
              View Orders
            </Link>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Master Account Global Noticeboard */}
          <MultiShopNoticeboard userId={user?.id} />

          {/* Quick Actions / Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Link
              to="/a/orders"
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-transparent hover:border-green-100 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-green-500 w-16 h-16 rounded-bl-full opacity-10"></div>
              {pendingOrdersCount > 0 && (
                 <div className="absolute top-4 right-4 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md">
                   {pendingOrdersCount}
                 </div>
              )}
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              🛎 Live Orders
            </h2>
            <p className="text-gray-500 text-sm">
              Manage incoming customer orders and trigger STK Pushes.
            </p>
          </Link>

          <Link
            to="/a/products"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              📋 Product Manager
            </h2>
            <p className="text-gray-500 text-sm">
              Add, edit, and remove products, categories and search tags.
            </p>
          </Link>

          <Link
            to="/a/attributes"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-transparent hover:border-orange-100 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-orange-400 w-16 h-16 rounded-bl-full opacity-10"></div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              🏷️ Attribute Manager
            </h2>
            <p className="text-gray-500 text-sm">
              Define custom product fields like Size, Color, or Vintage.
            </p>
          </Link>

          <Link
            to="/a/ai-brain"
            className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-indigo-400 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 bg-white/10 w-16 h-16 rounded-bl-full group-hover:scale-125 transition-transform"></div>
            <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              🧠 Shop Brain
              <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded text-white animate-pulse">AI Agent</span>
            </h2>
            <p className="text-indigo-100/70 text-sm">
              Train your Sales Assistant, set its personality, and manage credits.
            </p>
          </Link>



          <Link
            to={shopId ? `/a/bulk-image-mapper?shop_id=${shopId}` : `/a/bulk-image-mapper`}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-transparent hover:border-green-100 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-green-500 w-16 h-16 rounded-bl-full opacity-10"></div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
              📸 Bulk Image Mapper
            </h2>
            <p className="text-gray-500 text-sm">
              Upload images in bulk and auto-map them to your product catalog.
            </p>
          </Link>

          {planAccess.isPro ? (
             <a
               href="#analytics"
               className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-transparent hover:border-blue-100 relative overflow-hidden block cursor-pointer"
             >
               <div className="absolute top-0 right-0 bg-blue-500 w-16 h-16 rounded-bl-full opacity-10"></div>
               <h2 className="text-lg font-semibold text-gray-800 mb-2">
                 📈 Analytics
               </h2>
               <p className="text-gray-500 text-sm">
                 Historical data, popular items, and upsell tracking.
               </p>
             </a>
          ) : (
             <div 
               onClick={() => setLockedFeatureFocus("Advanced Analytics")}
               className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors relative"
             >
                <div className="absolute top-4 right-4 text-gray-400">🔒</div>
                <h2 className="text-lg font-semibold text-gray-500 mb-2">
                  📈 Analytics (Pro)
                </h2>
                <p className="text-gray-400 text-sm">
                  Upgrade to unlock historical data and upsell tracking.
                </p>
             </div>
          )}

          <Link
            to="/a/qrs"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-transparent hover:border-blue-100 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-blue-500 w-16 h-16 rounded-bl-full opacity-10"></div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              📱 QR Manager
            </h2>
            <p className="text-gray-500 text-sm">
              Deploy, track, and edit your fleet of smart QR table nodes.
            </p>
          </Link>

          <Link
            to="/a/settings"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-transparent hover:border-gray-200 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-gray-500 w-16 h-16 rounded-bl-full opacity-10"></div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              ⚙️ Settings
            </h2>
            <p className="text-gray-500 text-sm">
              Update store info, logo, passwords, and manage plan.
            </p>
          </Link>

          <button
            onClick={() => setShowGoogleModal(true)}
            style={{ fontFamily: 'var(--font-family, Outfit)' }}
            className={`bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all border-2 relative overflow-hidden text-left w-full cursor-pointer ${
              shop?.google_sync_enabled
                ? 'border-green-400 bg-green-50/30'
                : shop?.google_merchant_id
                ? 'border-red-300 bg-red-50/20'
                : 'border-transparent hover:border-blue-100'
            }`}
          >
            <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 ${shop?.google_sync_enabled ? 'bg-green-500' : 'bg-blue-500'}`}></div>

            {/* Header row */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                🌐 Google Shopping
              </h2>
              {/* One-tap master toggle */}
              <button
                onClick={handleToggleGoogleSync}
                title={shop?.google_sync_enabled ? 'Click to disable Google sync' : 'Click to enable Google sync'}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  shop?.google_sync_enabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    shop?.google_sync_enabled ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <p className="text-gray-500 text-sm mb-3">
              Manage Google Merchant Center feeds, site verification, and returns policy.
            </p>

            {/* Status badge */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                shop?.google_sync_enabled
                  ? 'bg-green-100 text-green-700'
                  : shop?.google_merchant_id
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                  shop?.google_sync_enabled ? 'bg-green-500 animate-pulse' : shop?.google_merchant_id ? 'bg-red-400' : 'bg-gray-400'
                }`}></span>
                {shop?.google_sync_enabled
                  ? 'Sync Active'
                  : shop?.google_merchant_id
                  ? 'Sync Paused'
                  : 'Not configured'}
              </span>
              {shop?.google_last_sync_at && (
                <span className="text-[10px] text-gray-400">
                  Last sync: {new Date(shop.google_last_sync_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </button>

          <Link
            to="/a/appearance"
            className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-transparent hover:border-indigo-200 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-indigo-500 w-16 h-16 rounded-bl-full opacity-10"></div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              🎨 Store Appearance
            </h2>
            <p className="text-gray-500 text-sm">
              Customise your public profile — logo, colours, fonts, layout &amp; hero text.
            </p>
          </Link>
        
          {planAccess.isPro ? (
             <Link
               to="/a/campaigns"
               className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-transparent hover:border-purple-100 relative overflow-hidden"
             >
               <div className="absolute top-0 right-0 bg-purple-500 w-16 h-16 rounded-bl-full opacity-10"></div>
               <h2 className="text-lg font-semibold text-gray-800 mb-2">
                 🎯 Campaigns
               </h2>
               <p className="text-gray-500 text-sm">
                 Manage promotional campaigns and targeted QR rewards.
               </p>
             </Link>
          ) : (
             <div
               onClick={() => setLockedFeatureFocus("Active Marketing Campaigns")}
               className="bg-gray-50 rounded-xl border border-gray-200 p-6 relative overflow-hidden cursor-pointer group"
             >
               <div className="absolute top-4 right-4 text-gray-400 group-hover:text-indigo-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
               </div>
               <h2 className="text-lg font-semibold text-gray-500 mb-2 transition-colors group-hover:text-gray-800">
                 🎯 Campaigns
               </h2>
               <p className="text-gray-400 text-sm">
                 Manage promotional campaigns and targeted QR rewards.
               </p>
             </div>
          )}

          {planAccess.isPro ? (
             <Link
               to="/a/marketing"
               className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-transparent hover:border-indigo-100 relative overflow-hidden"
             >
               <div className="absolute top-0 right-0 bg-indigo-500 w-16 h-16 rounded-bl-full opacity-10"></div>
               <h2 className="text-lg font-semibold text-gray-800 mb-2">
                 🎨 Marketing Studio
               </h2>
               <p className="text-gray-500 text-sm">
                 Create ads, manage promo bundles, and generate QR-specific discounts.
               </p>
             </Link>
          ) : (
             <div
               onClick={() => setLockedFeatureFocus("Marketing Studio")}
               className="bg-gray-50 rounded-xl border border-gray-200 p-6 relative overflow-hidden cursor-pointer group"
             >
               <div className="absolute top-4 right-4 text-gray-400 group-hover:text-indigo-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
               </div>
               <h2 className="text-lg font-semibold text-gray-500 mb-2 transition-colors group-hover:text-gray-800">
                 🎨 Marketing Studio
               </h2>
               <p className="text-gray-400 text-sm">
                 Create ads, manage promo bundles, and generate QR-specific discounts.
               </p>
             </div>
          )}

          {/* B2B / Distribution Section - Restricted to Admins or Verified Wholesalers */}
          {(user?.system_role === 'system_admin' || shop?.plan === 'business') && (
            <>
              <Link
                to="/a/connect-distribution"
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-transparent hover:border-indigo-100 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-indigo-600 w-16 h-16 rounded-bl-full opacity-10"></div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  📦 Distribution Connect
                </h2>
                <p className="text-gray-500 text-sm">
                  Discover verified wholesalers and order stock in bulk for your shop.
                </p>
              </Link>

              <Link
                to="/join/distribution-network"
                className="bg-indigo-50 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-transparent hover:border-indigo-200 relative overflow-hidden"
              >
                 <h2 className="text-lg font-semibold text-indigo-900 mb-2">
                   🤝 Partnership Gateway
                 </h2>
                 <p className="text-indigo-600/70 text-sm">
                   Apply to join the distribution network and sell bulk stock to other shops.
                 </p>
              </Link>

              <Link
                to="/a/supply-mgmt"
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-transparent hover:border-slate-500 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-slate-900 w-16 h-16 rounded-bl-full opacity-10"></div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  🚚 Supply Management
                </h2>
                <p className="text-gray-500 text-sm">
                  Wholesale distribution: List your products for other shops to buy.
                </p>
              </Link>
            </>
          )}

          {(user?.system_role === 'system_admin' || user?.role === 'delivery_manager' || user?.role === 'delivery_worker' || shop?.plan === 'business') && (
            <Link
              to="/a/delivery"
              className="bg-slate-900 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-slate-500 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 bg-white/20 w-16 h-16 rounded-bl-full opacity-10 group-hover:scale-125 transition-transform"></div>
              <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                🚚 Delivery Hub
                <span className="bg-green-500 text-[10px] px-1.5 py-0.5 rounded text-white animate-pulse">Logistics</span>
              </h2>
              <p className="text-slate-400 text-sm">
                Manage last-mile logistics, track riders, and optimize delivery routes.
              </p>
            </Link>
          )}

          <Link
            to="/a/finances"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-transparent hover:border-indigo-100 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-indigo-600 w-16 h-16 rounded-bl-full opacity-10"></div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              💰 Accounting Hub
            </h2>
            <p className="text-gray-500 text-sm">
              Track revenue, expenses, and net profit from your sales and wholesale orders.
            </p>
          </Link>

          <Link
            to="/plans"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              💳 Subscription
            </h2>
            <p className="text-gray-500 text-sm">
              Manage your plan and unlock premium features.
            </p>
          </Link>
        </div>
      </div>

        {/* Analytics Section */}
        <h2 id="analytics" className="text-lg font-bold text-gray-800 mb-4 pt-4">📊 Analytics</h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
            <p className="text-gray-500 text-sm">Loading analytics...</p>
          </div>
        ) : !shopId ? (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <p className="text-gray-500">
              Analytics will be available after logging in with Supabase authentication.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnalyticsChart
              title="Orders Per Day"
              data={ordersPerDay}
              labelKey="date"
              valueKey="count"
              unit="orders"
            />

            <AnalyticsChart
              title="Popular Items"
              data={popularItems}
              labelKey="name"
              valueKey="count"
              unit="sold"
              type="bar"
            />

            {/* Real-time Product Conversion Intelligence Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 col-span-1 md:col-span-2 relative overflow-hidden">
              {/* Live indicator */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
                <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Live</span>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-1">📊 Product Conversion Intelligence</h3>
              <p className="text-xs text-gray-400 mb-5">All customer interaction avenues — updates in real time</p>

              {convStats.loading ? (
                <div className="flex items-center gap-3 py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
                  <span className="text-sm text-gray-400">Computing live stats...</span>
                </div>
              ) : (
                <>
                  {/* Primary KPI row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                      <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-1">Overall Conv. Rate</p>
                      <p className="text-3xl font-black text-green-700">{convStats.overallRate}%</p>
                      <p className="text-[10px] text-green-500 mt-1">Across all touchpoints</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                      <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-1">Upsell Accept Rate</p>
                      <p className="text-3xl font-black text-blue-700">{convStats.upsellRate}%</p>
                      <p className="text-[10px] text-blue-500 mt-1">{convStats.upsellAccepted} of {convStats.upsellTotal} shown</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                      <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">Orders Today</p>
                      <div className="flex items-end gap-2">
                        <p className="text-3xl font-black text-amber-700">{convStats.ordersToday}</p>
                        {convStats.trend !== null && (
                          <span className={`text-xs font-black pb-1 ${
                            convStats.trend > 0 ? 'text-green-600' : convStats.trend < 0 ? 'text-red-500' : 'text-gray-400'
                          }`}>
                            {convStats.trend > 0 ? `▲ +${convStats.trend}` : convStats.trend < 0 ? `▼ ${convStats.trend}` : '→ 0'}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-amber-500 mt-1">vs. yesterday</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                      <p className="text-[10px] font-black text-purple-700 uppercase tracking-widest mb-1">Revenue Today</p>
                      <p className="text-2xl font-black text-purple-700">KSh {convStats.revenueToday.toLocaleString()}</p>
                      <p className="text-[10px] text-purple-500 mt-1">{convStats.ordersThisWeek} orders this week</p>
                    </div>
                  </div>

                  {/* Conversion funnel bar */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-bold text-gray-600">Conversion Funnel</p>
                      <p className="text-xs text-gray-400">{convStats.totalConversions} converted of {convStats.totalInteractions} interactions</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-700"
                        style={{ width: `${Math.min(convStats.overallRate, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block"></span>
                        <span className="text-[10px] text-gray-500">Upsell Modal</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block"></span>
                        <span className="text-[10px] text-gray-500">Completed Orders</span>
                      </div>
                      {convStats.lastUpdated && (
                        <span className="text-[10px] text-gray-300">Updated {convStats.lastUpdated.toLocaleTimeString()}</span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Traffic & Visit Analytics Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 col-span-1 md:col-span-2 relative overflow-hidden">
              <div className="absolute top-4 right-4 flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                </span>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Live</span>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-1">🏪 Traffic &amp; Visit Analytics</h3>
              <p className="text-xs text-gray-400 mb-5">Shop profile visits, QR scans, and conversion rates</p>

              {visitStats.loading ? (
                <div className="flex items-center gap-3 py-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                  <span className="text-sm text-gray-400">Computing traffic stats...</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-2">
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-100">
                    <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-1">Total Profile Visits</p>
                    <p className="text-3xl font-black text-indigo-700">{visitStats.totalVisits}</p>
                    <p className="text-[10px] text-indigo-500 mt-1">All time direct &amp; QR</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-4 border border-blue-100">
                    <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-1">Visits Today</p>
                    <p className="text-3xl font-black text-blue-700">{visitStats.visitsToday}</p>
                    <p className="text-[10px] text-blue-500 mt-1">Directly today</p>
                  </div>
                  <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-xl p-4 border border-sky-100">
                    <p className="text-[10px] font-black text-sky-700 uppercase tracking-widest mb-1">Visit Trend</p>
                    <p className="text-3xl font-black text-sky-700">
                      {visitStats.trend > 0 ? `▲ +${visitStats.trend}%` : visitStats.trend < 0 ? `▼ ${visitStats.trend}%` : '→ 0%'}
                    </p>
                    <p className="text-[10px] text-sky-500 mt-1">vs yesterday</p>
                  </div>
                  <div className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl p-4 border border-cyan-100">
                    <p className="text-[10px] font-black text-cyan-700 uppercase tracking-widest mb-1">Visit → Order Rate</p>
                    <p className="text-3xl font-black text-cyan-700">{visitStats.conversionToOrder}%</p>
                    <p className="text-[10px] text-cyan-500 mt-1">Conversion funnel rate</p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Revenue Per Day
              </h3>
              {ordersPerDay.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {ordersPerDay.map((day, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600">{day.date}</span>
                      <span className="font-medium text-gray-800">KSh {day.revenue}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No revenue data yet.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
