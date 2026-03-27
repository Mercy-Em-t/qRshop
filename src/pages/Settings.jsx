import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { getCurrentUser } from "../services/auth-service";

export default function Settings() {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  const navigate = useNavigate();
  const user = getCurrentUser();
  const SHOP_ID = user?.shop_id;

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from("shops").select("*").eq("id", SHOP_ID).single();
    if (data) setShop(data);
    setLoading(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("shops").update({
      name: shop.name,
      description: shop.description,
      whatsapp_number: shop.whatsapp_number,
      payment_mode: shop.payment_mode,
      address: shop.address,
      industry_type: shop.industry_type,
      delivery_fee_fixed: shop.delivery_fee_fixed,
      min_order_value: shop.min_order_value,
      is_open: shop.is_open
    }).eq("id", SHOP_ID);
    
    setSaving(false);
    setMessage(error ? "Error updating settings" : "Settings updated successfully!");
    setTimeout(() => setMessage(null), 3000);
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Syncing Savannah...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
           <h1 className="text-xl font-bold text-gray-900">Shop Settings</h1>
           <button onClick={() => navigate('/dashboard')} className="text-xs font-bold text-gray-400 hover:text-gray-600 transition uppercase tracking-widest">Back to Dashboard</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleUpdate} className="space-y-6">
           
           {/* Basic Identity */}
           <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Classic Profile</h2>
              <div className="grid md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Shop Name</label>
                    <input 
                       type="text" value={shop.name} 
                       onChange={e => setShop({...shop, name: e.target.value})}
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-green-600 focus:bg-white transition"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">WhatsApp Number</label>
                    <input 
                       type="text" value={shop.whatsapp_number} 
                       onChange={e => setShop({...shop, whatsapp_number: e.target.value})}
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-green-600 focus:bg-white transition"
                    />
                 </div>
                 <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Description</label>
                    <textarea 
                       value={shop.description} 
                       onChange={e => setShop({...shop, description: e.target.value})}
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-green-600 focus:bg-white transition h-24"
                    />
                 </div>
              </div>
           </div>

           {/* KYC & Verification (NEW FEATURE) */}
           <div className="bg-indigo-50 rounded-2xl p-8 border border-indigo-100 shadow-sm">
              <div className="flex items-center justify-between mb-6 border-b border-indigo-100 pb-4">
                 <h2 className="text-sm font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                    🛡️ Merchant Verification
                    <span className="text-[10px] bg-white text-indigo-600 px-2 py-0.5 rounded font-black tracking-tighter uppercase whitespace-nowrap">Tier 1</span>
                 </h2>
              </div>
              <p className="text-xs text-indigo-700/70 mb-6 leading-relaxed">Verification unlocks premium features like M-Pesa STK Push and Global Discovery. Complete your profile to build trust with customers.</p>
              <button disabled className="bg-white text-indigo-400 font-bold py-3 px-6 rounded-xl border border-indigo-200 text-xs uppercase tracking-widest opacity-60">Verified Credentials</button>
           </div>

           {/* Operational Logistics */}
           <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Logistics & Payments</h2>
              <div className="grid md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Industry Type</label>
                    <select 
                       value={shop.industry_type} 
                       onChange={e => setShop({...shop, industry_type: e.target.value})}
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-green-600 focus:bg-white transition"
                    >
                       <option value="retail">Retail/Merchandise</option>
                       <option value="food">Gastro/Kitchen</option>
                       <option value="services">Services/Booking</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Payment Mode</label>
                    <select 
                       value={shop.payment_mode} 
                       onChange={e => setShop({...shop, payment_mode: e.target.value})}
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-green-600 focus:bg-white transition"
                    >
                       <option value="manual">Manual Checkout</option>
                       <option value="stk">M-Pesa STK Push</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Local Delivery Fee (KSh)</label>
                    <input 
                       type="number" value={shop.delivery_fee_fixed} 
                       onChange={e => setShop({...shop, delivery_fee_fixed: Number(e.target.value)})}
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-green-600 focus:bg-white transition"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Minimum Order (KSh)</label>
                    <input 
                       type="number" value={shop.min_order_value} 
                       onChange={e => setShop({...shop, min_order_value: Number(e.target.value)})}
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-green-600 focus:bg-white transition"
                    />
                 </div>
              </div>
           </div>

           {/* Logistics Hub & Communities (NEW FEATURES) */}
           <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-xl group">
                 <h3 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] mb-4">Logistics Hub</h3>
                 <p className="text-[10px] text-slate-500 mb-6 leading-relaxed">Connect to the regional Savannah dispatch network to outsource your delivery fulfillment.</p>
                 <button disabled className="w-full bg-slate-800 text-slate-500 py-3 rounded-xl border border-slate-700 text-[10px] font-black uppercase tracking-widest">Connect Hub (Soon)</button>
              </div>
              <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-xl group">
                 <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-4">Market Discovery</h3>
                 <p className="text-[10px] text-slate-500 mb-6 leading-relaxed">Your shop is visible in the global Savannah directory. Join localized neighborhood hubs.</p>
                 <button disabled className="w-full bg-slate-800 text-slate-500 py-3 rounded-xl border border-slate-700 text-[10px] font-black uppercase tracking-widest">Join Neighborhood</button>
              </div>
           </div>

           {/* Financial Architecture (NEW FEATURE) */}
           {shop.platform_commission_rate !== undefined && (
              <div className="bg-amber-50 rounded-2xl p-8 border border-amber-100 italic font-medium shadow-inner">
                 <p className="text-amber-900 text-xs">Platform Governance: Standard Commission Rate is locked at <span className="font-bold underline">{shop.platform_commission_rate}%</span> for your current plan tier.</p>
              </div>
           )}

           <div className="flex items-center justify-between gap-4 sticky bottom-4 z-10 bg-white/80 backdrop-blur p-4 rounded-3xl shadow-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                 <div className={`w-3 h-3 rounded-full ${shop.is_open ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                 <span className="text-xs font-black uppercase tracking-widest text-gray-500">{shop.is_open ? 'Shop is Live' : 'Shop is Closed'}</span>
                 <input 
                    type="checkbox" checked={shop.is_open} 
                    onChange={e => setShop({...shop, is_open: e.target.checked})}
                    className="w-5 h-5 accent-green-600 rounded cursor-pointer"
                 />
              </div>
              <button 
                 type="submit" disabled={saving}
                 className="bg-green-600 text-white font-black py-4 px-10 rounded-2xl hover:bg-green-700 transition shadow-xl hover:shadow-green-500/20 active:scale-95 disabled:opacity-50 uppercase text-xs tracking-[0.2em]"
              >
                 {saving ? 'Syncing...' : 'Lock Changes'}
              </button>
           </div>
           
           {message && <div className="fixed top-24 right-6 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl animate-in font-bold text-xs uppercase tracking-widest z-50 border border-slate-700">{message}</div>}
        </form>
      </main>
    </div>
  );
}
