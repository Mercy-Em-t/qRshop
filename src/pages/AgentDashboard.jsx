import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { getCurrentUser } from "../services/auth-service";

const AI_BACKEND_URL = import.meta.env.VITE_AI_BACKEND_URL || "http://localhost:3000";

export default function AgentDashboard() {
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Hello! I am your AI Assistant. How can I help you manage your shop today?" }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  
  const navigate = useNavigate();
  const user = getCurrentUser();
  const shopId = user?.shop_id;

  useEffect(() => {
    if (!shopId) navigate("/login");
  }, [shopId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    setMessages(prev => [...prev, { sender: "user", text }]);
    setInput("");
    setTyping(true);

    try {
      // Deduct Token FIRST
      const { data: tokenData, error: tokenError } = await supabase.rpc('deduct_tokens', {
        p_shop_id: shopId,
        p_amount: 1,
        p_description: 'AI Agent Query',
        p_allow_negative: false
      });

      if (tokenError || !tokenData?.success) {
        setMessages(prev => [...prev, { sender: "ai", text: "⚠️ " + (tokenData?.message || "Insufficient tokens to use the AI Agent. Please top up or request Okoa Jahazi.") }]);
        return;
      }

      // First, try routing through the edge function (similar to SalesBrainManager sandbox)
      const { data: menuItems } = await supabase
        .from("menu_items")
        .select("*")
        .eq("shop_id", shopId);

      const { data, error } = await supabase.functions.invoke('sales-assistant', {
        body: {
          messages: messages.map(m => ({
            role: m.sender === 'ai' ? 'assistant' : 'user',
            content: m.text
          })).concat([{ role: 'user', content: text }]),
          menuItems: menuItems || [],
          shopId
        }
      });

      if (error) throw error;

      setMessages(prev => [...prev, {
        sender: "ai",
        text: data.reply || "I've processed your request."
      }]);
    } catch (err) {
      console.error("Agent chat failed:", err);
      setMessages(prev => [...prev, { sender: "ai", text: `⚠️ Error communicating with agent: ${err.message}` }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 pb-16 md:pb-0">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/a')} className="text-slate-400 hover:text-slate-600 transition">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
              AI Agent Workspace
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shop Owner Terminal</p>
          </div>
        </div>
        <button onClick={() => navigate('/a/ai-brain')} className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition uppercase tracking-widest border border-indigo-100">
           Brain Settings
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        <div className="max-w-4xl mx-auto w-full space-y-6">
           {messages.map((m, idx) => (
             <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] md:max-w-[75%] rounded-3xl px-5 py-4 shadow-sm text-sm ${
                   m.sender === 'user' 
                     ? 'bg-indigo-600 text-white rounded-br-sm' 
                     : 'bg-white text-slate-800 border border-slate-100 rounded-bl-sm'
                }`}>
                  <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                </div>
             </div>
           ))}
           {typing && (
             <div className="flex justify-start">
                <div className="bg-white border border-slate-100 rounded-3xl rounded-bl-sm px-5 py-4 shadow-sm flex gap-1">
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                  <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                </div>
             </div>
           )}
           <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 p-4 shrink-0">
         <div className="max-w-4xl mx-auto flex gap-3 relative">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask your agent to perform a task or review data..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition font-medium text-slate-900"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || typing}
              className="bg-indigo-600 hover:bg-indigo-700 text-white w-14 h-14 rounded-2xl flex items-center justify-center transition shadow-md disabled:opacity-50 absolute right-1 top-1 bottom-1"
            >
              <svg className="w-6 h-6 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
         </div>
         <p className="text-center text-[10px] text-slate-400 mt-3 font-bold uppercase tracking-widest">Responses are generated by AI. Check critical info.</p>
      </footer>
    </div>
  );
}
