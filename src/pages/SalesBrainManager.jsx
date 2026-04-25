import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { getCurrentUser } from "../services/auth-service";

export default function SalesBrainManager() {
  const [brain, setBrain] = useState({
    personality: "Professional Sales Assistant",
    tone: "professional and helpful",
    sales_playbook: "",
    custom_context: ""
  });
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  const navigate = useNavigate();
  const user = getCurrentUser();
  const shopId = user?.shop_id;

  useEffect(() => {
    if (!shopId) {
      navigate("/login");
      return;
    }
    fetchBrain();
  }, [shopId]);

  const fetchBrain = async () => {
    try {
      const { data, error } = await supabase
        .from("shops")
        .select("sales_brain, ai_credits")
        .eq("shop_id", shopId)
        .single();
      
      if (error) throw error;
      if (data) {
        if (data.sales_brain) setBrain(data.sales_brain);
        setCredits(data.ai_credits || 0);
      }
    } catch (err) {
      console.error("Failed to fetch brain:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from("shops")
        .update({ sales_brain: brain })
        .eq("shop_id", shopId);
      
      if (error) throw error;
      setMessage("AI Brain synchronization complete!");
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      alert("Failed to sync AI Brain: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-indigo-600 font-bold">Synchronizing Brain Waves...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900 pb-20">
      <header className="border-b border-gray-200 px-6 py-6 sticky top-0 z-10 bg-white/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
           <div>
             <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
               <span className="text-indigo-600">🧠</span> Shop Brain Manager
             </h1>
             <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] mt-1 font-bold">AI Calibration Suite</p>
           </div>
           <button onClick={() => navigate('/a')} className="text-[10px] font-black text-slate-500 hover:text-slate-900 transition uppercase tracking-widest border border-gray-200 px-4 py-2 rounded-full">Exit Suite</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8 mt-4">
        
        {/* Credits Status */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="relative z-10 flex items-center justify-between text-white">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100 mb-1">Available Intelligence Credits</p>
              <h2 className="text-5xl font-black">{credits}</h2>
              <p className="text-xs text-indigo-200 mt-2 font-medium opacity-80">1 Credit = 1 AI Sales Interaction</p>
            </div>
            <button 
              onClick={() => navigate('/a/settings')}
              className="bg-white text-indigo-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition shadow-lg"
            >
              Top Up
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          
          <section className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-8 flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
              Core Persona Configuration
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Identity Name</label>
                <input 
                  type="text" 
                  value={brain.personality}
                  onChange={e => setBrain({...brain, personality: e.target.value})}
                  placeholder="e.g. Health Concierge, Master Sommelier"
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition font-bold text-slate-900 placeholder:text-slate-300"
                />
                <p className="text-[10px] text-slate-400">How should the customer address this agent?</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Engagement Tone</label>
                <select 
                  value={brain.tone}
                  onChange={e => setBrain({...brain, tone: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:border-indigo-500 transition font-bold text-slate-900 cursor-pointer"
                >
                  <option value="not too chatty, not too rigid, professional and helpful">Professional & Balanced</option>
                  <option value="enthusiastic, warm, and highly conversational">Warm & Energetic</option>
                  <option value="direct, ultra-concise, and efficiency-focused">Direct & Efficient</option>
                  <option value="luxury, sophisticated, and premium-focused">Luxury & Sophisticated</option>
                </select>
                <p className="text-[10px] text-slate-400">Influences the agent's vocabulary and pacing.</p>
              </div>
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-8 flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
              Sales Playbook
            </h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operational Instructions</label>
                <textarea 
                  value={brain.sales_playbook}
                  onChange={e => setBrain({...brain, sales_playbook: e.target.value})}
                  placeholder="e.g. Always suggest a 500g pack if they ask about size. Mention free delivery for orders over 5k."
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:border-indigo-500 h-32 transition font-medium text-slate-900 placeholder:text-slate-300 resize-none"
                />
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Strategy mode: active</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Custom Shop Context</label>
                <textarea 
                  value={brain.custom_context}
                  onChange={e => setBrain({...brain, custom_context: e.target.value})}
                  placeholder="e.g. We are a locally-owned farm in Kiambu. All our honey is raw and unfiltered."
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:border-indigo-500 h-24 transition font-medium text-slate-900 placeholder:text-slate-300 resize-none"
                />
                <p className="text-[10px] text-slate-400">Specific facts the AI should know about your shop.</p>
              </div>
            </div>
          </section>

          <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-gray-100 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status: Calibration Ready</p>
            </div>
            <button 
              type="submit"
              disabled={saving}
              className="bg-indigo-600 text-white font-black py-4 px-12 rounded-2xl hover:bg-indigo-700 transition shadow-xl hover:shadow-indigo-500/20 active:scale-95 disabled:opacity-50 uppercase text-xs tracking-[0.2em]"
            >
              {saving ? 'Synchronizing...' : 'Upload Brain Profile'}
            </button>
          </div>

        </form>
      </main>
      
      {message && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl animate-in font-bold text-xs uppercase tracking-widest z-50 border border-slate-700 flex items-center gap-3">
          <span className="text-xl">⚡</span> {message}
        </div>
      )}
    </div>
  );
}
