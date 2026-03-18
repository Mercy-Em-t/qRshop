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
    name: "", description: "", tagline: "", address: "",
    phone: "", whatsapp_number: "", is_online: true,
  });

  // Logo upload
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);

  // Password change
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
          tagline: data.tagline || "", address: data.address || "",
          phone: data.phone || "", whatsapp_number: data.whatsapp_number || "",
          is_online: data.is_online ?? true,
        });
        if (data.logo_url) setLogoPreview(data.logo_url);
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
      const { error } = await supabase.from("shops").update(formData).eq("id", shopId);
      if (error) throw error;
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

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;
    setLogoUploading(true);
    try {
      const ext = logoFile.name.split('.').pop();
      const path = `logos/${shopId}/logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("product-images").upload(path, logoFile, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      const logoUrl = urlData.publicUrl;
      await supabase.from("shops").update({ logo_url: logoUrl }).eq("id", shopId);
      setLogoPreview(logoUrl);
      setLogoFile(null);
      alert("Logo updated!");
    } catch (err) {
      alert("Logo upload failed: " + err.message);
    } finally {
      setLogoUploading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdError(""); setPwdOk(false);
    if (newPwd.length < 8) { setPwdError("Minimum 8 characters."); return; }
    if (newPwd !== confirmPwd) { setPwdError("Passwords do not match."); return; }
    setPwdSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) throw error;
      setPwdOk(true);
      setNewPwd(""); setConfirmPwd("");
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

        {/* Plan Status */}
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
        </div>

        {/* Storefront Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center justify-between">
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
              <input type="file" accept="image/*" onChange={handleLogoChange} className="text-sm text-gray-600 mb-3 block" />
              {logoFile && (
                <button
                  onClick={handleLogoUpload}
                  disabled={logoUploading}
                  className="bg-gray-900 text-white text-sm px-4 py-2 rounded-xl font-bold hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {logoUploading ? "Uploading..." : "Upload Logo"}
                </button>
              )}
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
            <div className="pt-4 border-t border-gray-100 flex items-center gap-4">
              <button type="submit" disabled={saving} className="bg-gray-900 text-white px-7 py-2.5 rounded-xl font-bold hover:bg-gray-800 transition disabled:opacity-50 text-sm">
                {saving ? "Saving..." : "Save Changes"}
              </button>
              {savedOk && <span className="text-green-600 text-sm font-semibold">✓ Saved successfully!</span>}
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
            <div className="grid md:grid-cols-2 gap-5">
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

      </main>
    </div>
  );
}
