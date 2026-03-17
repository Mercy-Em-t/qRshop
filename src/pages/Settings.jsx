import { useState, useEffect } from "react";
import { getCurrentUser } from "../services/auth-service";
import { supabase } from "../services/supabase-client";
import { useNavigate, Link } from "react-router-dom";

export default function Settings() {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tagline: "",
    address: "",
    phone: "",
    whatsapp_number: "",
    is_online: true,
  });

  const navigate = useNavigate();
  const user = getCurrentUser();
  const shopId = user?.shop_id;

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    async function fetchShop() {
      if (!shopId) return;
      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .eq("id", shopId)
        .single();

      if (data) {
        setShop(data);
        setFormData({
          name: data.name || "",
          description: data.description || "",
          tagline: data.tagline || "",
          address: data.address || "",
          phone: data.phone || "",
          whatsapp_number: data.whatsapp_number || "",
          is_online: data.is_online,
        });
      }
      setLoading(false);
    }
    
    fetchShop();
  }, [shopId, navigate, user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from("shops")
        .update(formData)
        .eq("id", shopId);
        
      if (error) throw error;
      alert("Settings updated successfully.");
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
      const { error } = await supabase
        .from("shops")
        .update({ is_online: newStatus })
        .eq("id", shopId);
        
      if (error) throw error;
      setFormData(prev => ({ ...prev, is_online: newStatus }));
    } catch (err) {
      alert("Failed to toggle status: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-gray-800">Shop Settings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
           
           <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
              <div>
                 <h2 className="text-lg font-bold text-gray-900">Storefront Status</h2>
                 <p className="text-sm text-gray-500 mt-1">Accepting active live orders?</p>
              </div>
              <button
                onClick={handleToggleOnline}
                disabled={saving}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${formData.is_online ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${formData.is_online ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
           </div>

           <form onSubmit={handleUpdate} className="space-y-6">
             <div className="grid md:grid-cols-2 gap-6">
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-2">Shop Name</label>
                 <input
                   type="text"
                   required
                   className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                   value={formData.name}
                   onChange={e => setFormData({...formData, name: e.target.value})}
                 />
               </div>
               <div>
                 <label className="block text-sm font-bold text-gray-700 mb-2">Tagline (Short)</label>
                 <input
                   type="text"
                   className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                   value={formData.tagline}
                   onChange={e => setFormData({...formData, tagline: e.target.value})}
                   placeholder="e.g. Best Burgers in Nairobi"
                 />
               </div>
             </div>

             <div>
               <label className="block text-sm font-bold text-gray-700 mb-2">Full Description</label>
               <textarea
                 className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                 rows="3"
                 value={formData.description}
                 onChange={e => setFormData({...formData, description: e.target.value})}
                 placeholder="Tell your customers about your shop..."
               />
             </div>

             <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">General Phone Number</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">WhatsApp Number</label>
                  <p className="text-xs text-gray-400 mb-1">Orders will be routed here. Format starting with country code e.g. +254</p>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-green-200 bg-green-50 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                    value={formData.whatsapp_number}
                    onChange={e => setFormData({...formData, whatsapp_number: e.target.value})}
                    placeholder="+254700000000"
                  />
                </div>
             </div>

             <div>
               <label className="block text-sm font-bold text-gray-700 mb-2">Physical Address</label>
               <textarea
                 className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                 rows="2"
                 value={formData.address}
                 onChange={e => setFormData({...formData, address: e.target.value})}
                 placeholder="Where are you located?"
               />
             </div>

             <div className="pt-6 border-t border-gray-100 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Configuration"}
                </button>
             </div>
           </form>
        </div>
      </main>
    </div>
  );
}
