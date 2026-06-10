import { useState, useEffect } from "react";
import { supabase } from "../services/supabase-client";

export default function CommunicationsSettingsTab({ shopId }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    whatsapp_enabled: true,
    email_enabled: true,
    custom_resend_key: ""
  });
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = await supabase
          .from("shop_communication_settings")
          .select("*")
          .eq("shop_id", shopId)
          .single();

        if (error && error.code !== "PGRST116") throw error;
        
        if (data) {
          setSettings({
            whatsapp_enabled: data.whatsapp_enabled,
            email_enabled: data.email_enabled,
            custom_resend_key: data.custom_resend_key || ""
          });
        }
      } catch (err) {
        console.error("Error loading communication settings:", err);
      } finally {
        setLoading(false);
      }
    }
    
    if (shopId) loadSettings();
  }, [shopId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from("shop_communication_settings")
        .upsert({
          shop_id: shopId,
          whatsapp_enabled: settings.whatsapp_enabled,
          email_enabled: settings.email_enabled,
          custom_resend_key: settings.custom_resend_key || null,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setToast({ show: true, message: "Communication settings saved successfully!", type: "success" });
      setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
    } catch (err) {
      console.error("Save error:", err);
      setToast({ show: true, message: "Failed to save settings.", type: "error" });
      setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 font-bold animate-pulse">Loading communications config...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl flex items-center gap-3 animate-slide-up ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {toast.type === 'success' ? '✅' : '❌'}
          <p className="font-bold text-sm">{toast.message}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>📡</span> Automated Communications
          </h2>
          <p className="text-sm text-slate-500 mt-1">Configure how your shop communicates with customers.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex items-start gap-4">
            <input 
              type="checkbox" 
              id="whatsapp_enabled"
              checked={settings.whatsapp_enabled}
              onChange={(e) => setSettings({...settings, whatsapp_enabled: e.target.checked})}
              className="mt-1 w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <div>
              <label htmlFor="whatsapp_enabled" className="font-bold text-slate-800 block cursor-pointer">Enable WhatsApp Notifications</label>
              <p className="text-xs text-slate-500 mt-1">
                Automatically send WhatsApp alerts to customers when their order status changes (e.g., Pending, Accepted, Ready).
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex items-start gap-4">
            <input 
              type="checkbox" 
              id="email_enabled"
              checked={settings.email_enabled}
              onChange={(e) => setSettings({...settings, email_enabled: e.target.checked})}
              className="mt-1 w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
            />
            <div>
              <label htmlFor="email_enabled" className="font-bold text-slate-800 block cursor-pointer">Enable Email Receipts</label>
              <p className="text-xs text-slate-500 mt-1">
                Automatically send rich HTML email receipts to customers when an order is placed.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
             <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
               <span>📧</span> Custom Resend API Key <span className="bg-indigo-100 text-indigo-700 text-[9px] uppercase px-2 py-0.5 rounded-full tracking-wider font-black">Pro</span>
             </h3>
             <p className="text-xs text-slate-500 mb-4">
               By default, emails are sent from our platform domain. If you want to use your own domain and Resend account, provide your API key below.
             </p>
             <input
               type="password"
               value={settings.custom_resend_key}
               onChange={(e) => setSettings({...settings, custom_resend_key: e.target.value})}
               placeholder="re_xxxxxxxxxxxxxxxxxxxxx"
               className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
             />
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-slate-900 text-white font-bold py-3 px-8 rounded-xl hover:bg-slate-800 transition-colors shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer select-none"
            >
              {saving ? "Saving..." : "💾 Save Communication Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
