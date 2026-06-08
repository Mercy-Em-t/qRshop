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
  
  // Custom Hardening & Auditing States
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [activeLogId, setActiveLogId] = useState(null);

  // Sandbox Calibration Playground States
  const [sandboxMessages, setSandboxMessages] = useState([
    { sender: "ai", text: "🤖 Sandbox Playground Active! I am initialized with your current unsaved inputs. Tweak personality or playbook above and ask me questions here to calibrate my responses instantly!" }
  ]);
  const [sandboxInput, setSandboxInput] = useState("");
  const [sandboxTyping, setSandboxTyping] = useState(false);
  
  const navigate = useNavigate();
  const user = getCurrentUser();
  const shopId = user?.shop_id;

  useEffect(() => {
    if (!shopId) {
      navigate("/login");
      return;
    }
    fetchBrain();
    fetchLogs();
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

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const { data, error } = await supabase
        .from("ai_usage_logs")
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error("Failed to fetch AI audit logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSendSandbox = async () => {
    const text = sandboxInput.trim();
    if (!text) return;

    setSandboxMessages(prev => [...prev, { sender: "user", text }]);
    setSandboxInput("");
    setSandboxTyping(true);

    try {
      const { data: menuItems } = await supabase
        .from("menu_items")
        .select("*")
        .eq("shop_id", shopId);

      const { data, error } = await supabase.functions.invoke('sales-assistant', {
        body: {
          messages: sandboxMessages.map(m => ({
            role: m.sender === 'ai' ? 'assistant' : 'user',
            content: m.text
          })).concat([{ role: 'user', content: text }]),
          menuItems: menuItems || [],
          shopId,
          brainOverride: brain
        }
      });

      if (error) throw error;

      setSandboxMessages(prev => [...prev, {
        sender: "ai",
        text: data.reply || "I'm updated with your settings! Ask me anything."
      }]);
    } catch (err) {
      console.error("Sandbox failure:", err);
      setSandboxMessages(prev => [...prev, { sender: "ai", text: `⚠️ Error during calibration: ${err.message}` }]);
    } finally {
      setSandboxTyping(false);
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
              onClick={() => navigate('/a/subscription')}
              className="bg-white text-indigo-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition shadow-lg cursor-pointer"
            >
              Top Up
            </button>
          </div>
        </div>

        {/* Three-Tier Credit Alerts Notification Banners */}
        {credits <= 50 && (() => {
          const alert = credits <= 0 
            ? { text: "🚨 URGENT: Intelligence credits depleted. Sales Assistant has fallen back to offline search.", color: "bg-red-50 text-red-800 border-red-200" }
            : credits <= 5 
            ? { text: `🚨 CRITICAL WARNING: Only ${credits} credits left. Sales Assistant will lock into emergency catalog fallback soon.`, color: "bg-red-50 text-red-800 border-red-200 animate-pulse" }
            : credits <= 25 
            ? { text: `⚠️ WARNING: Credits running low (${credits} credits left). Top up soon to prevent assistant fallback.`, color: "bg-amber-50 text-amber-800 border-amber-200" }
            : { text: `💡 NOTICE: AI Credits are decreasing (${credits} remaining). Keeping credits high guarantees fast AI answers.`, color: "bg-indigo-50 text-indigo-800 border-indigo-200" };
          return (
            <div className={`p-4 rounded-2xl border text-xs font-black uppercase tracking-wider ${alert.color} flex items-center gap-3 shadow-md`}>
              <span>{alert.text}</span>
            </div>
          );
        })()}

        <form onSubmit={handleSave} className="space-y-6">
          
          <section className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <h2 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-8 flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>
              Core Persona Configuration
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">What should we call your AI?</label>
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
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">How should the AI talk?</label>
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
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Secret Instructions</label>
                <textarea 
                  value={brain.sales_playbook}
                  onChange={e => setBrain({...brain, sales_playbook: e.target.value})}
                  placeholder="e.g. Always suggest a 500g pack if they ask about size. Mention free delivery for orders over 5k."
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:border-indigo-500 h-32 transition font-medium text-slate-900 placeholder:text-slate-300 resize-none"
                />
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Strategy mode: active</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Shop Background</label>
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

        {/* Dynamic Sandbox & Audit logs grid */}
        <div className="grid md:grid-cols-2 gap-8 mt-8">
          
          {/* Sandbox Playground Panel */}
          <section className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm flex flex-col h-[520px]">
            <h2 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
              AI Training Playground
            </h2>
            <p className="text-[10px] text-slate-400 mb-4 leading-relaxed font-bold">
              Test your unsaved personality and playbook modifications here to verify calibration instantly.
            </p>
            
            {/* Screen */}
            <div className="flex-1 overflow-y-auto bg-gray-50 rounded-2xl p-4 space-y-3 mb-4 max-h-[340px]">
              {sandboxMessages.map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs font-bold leading-relaxed ${
                    m.sender === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-gray-200 shadow-sm'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {sandboxTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 text-slate-400 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-2xl animate-pulse">
                    AI Syncing Playground Context...
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="flex gap-2 shrink-0">
              <input 
                type="text" 
                value={sandboxInput}
                onChange={e => setSandboxInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendSandbox()}
                placeholder="Ask assistant something..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 font-bold text-xs"
              />
              <button 
                type="button"
                onClick={handleSendSandbox}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-xl font-black text-xs uppercase tracking-widest transition"
              >
                Test
              </button>
            </div>
          </section>

          {/* Collapsible drawer audit logs ledger */}
          <section className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm flex flex-col h-[520px]">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                AI Credit Audit Ledger
              </h2>
              <button 
                type="button"
                onClick={fetchLogs} 
                className="text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-800 tracking-widest"
              >
                Refresh
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mb-4 leading-relaxed font-bold">
              Review live conversational audits and exact intelligence credits usage.
            </p>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {logsLoading ? (
                <div className="text-center py-10 text-xs text-slate-400 font-black uppercase tracking-widest animate-pulse">Syncing Usage Ledger...</div>
              ) : logs.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl">
                  <p className="text-xs text-slate-400 font-black uppercase tracking-wider">No logs available</p>
                  <p className="text-[9px] text-slate-300 mt-1 font-bold">Conversations will populate here in real time.</p>
                </div>
              ) : (
                logs.map((log) => {
                  const isOpen = activeLogId === log.id;
                  return (
                    <div 
                      key={log.id} 
                      className={`border border-gray-100 rounded-2xl overflow-hidden transition-all duration-300 ${
                        isOpen ? 'ring-1 ring-indigo-500/30 bg-indigo-50/20' : 'bg-gray-50/50 hover:bg-gray-50'
                      }`}
                    >
                      {/* Accordion header */}
                      <button
                        type="button"
                        onClick={() => setActiveLogId(isOpen ? null : log.id)}
                        className="w-full flex items-center justify-between p-4 cursor-pointer text-left focus:outline-none"
                      >
                        <div className="min-w-0 pr-4">
                          <p className="text-xs font-black text-slate-700 truncate">
                            "{log.user_query || 'Catalog exploration'}"
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold mt-1">
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-3">
                          <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">
                            -{log.credits_deducted || 1} CR
                          </span>
                          <svg 
                            className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {/* Smooth collapsible accordion content */}
                      <div 
                        className={`transition-all duration-300 ease-in-out overflow-hidden ${
                          isOpen ? 'max-h-[300px] border-t border-gray-100/60 p-4 space-y-3' : 'max-h-0'
                        }`}
                      >
                        <div className="space-y-1">
                          <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Query</p>
                          <p className="text-xs text-slate-600 bg-white border border-gray-100 p-3 rounded-xl font-medium leading-relaxed">
                            {log.user_query}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[8px] font-black uppercase tracking-widest text-indigo-400">AI Response</p>
                          <p className="text-xs text-indigo-900 bg-white border border-indigo-100/50 p-3 rounded-xl font-medium leading-relaxed font-semibold">
                            {log.ai_response}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                          <span>⚡ Consumed: {log.tokens_consumed || 0} Tokens</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

        </div>

      </main>
      
      {message && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl animate-in font-bold text-xs uppercase tracking-widest z-50 border border-slate-700 flex items-center gap-3">
          <span className="text-xl">⚡</span> {message}
        </div>
      )}
    </div>
  );
}
