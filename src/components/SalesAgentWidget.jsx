/**
 * SalesAgentWidget.jsx
 * Layer: Presentation + Light Application Logic (CLIENT-SIDE ONLY)
 *
 * This widget floats on the catalog page and helps clients discover products.
 * It calls addItem() from useCart directly — NO backend calls.
 * All order mutations happen via checkout_cart RPC through the API Gateway.
 */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase-client";

export default function SalesAgentWidget({ menuItems = [], addItem, shopId }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "👋 Hello! I'm your Sales Assistant. I can help you find products and add them to your cart. What are you looking for today?",
    },
  ]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Dynamic Quick Replies based on actual shop inventory
  const categories = [...new Set(menuItems.map(item => item.category).filter(Boolean))];
  const QUICK_REPLIES = [
    ...categories.slice(0, 4).map(cat => ({ label: `📦 ${cat}`, query: cat })),
    { label: "🔥 What's popular?", query: "popular" },
    { label: "💰 Affordable", query: "cheap" },
  ];

  useEffect(() => {
    if (isOpen) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const findProducts = (query) => {
    const q = query.toLowerCase().trim();
    
    // Greeting Handler
    if (["hey", "hello", "hi", "greetings", "sup", "yo"].includes(q)) {
      return "GREETING";
    }

    // Filter by Category first
    const categoryMatches = menuItems.filter((p) => p.category?.toLowerCase().includes(q));
    if (categoryMatches.length > 0) return categoryMatches.slice(0, 3);

    // Sorting overrides
    if (q.includes("popular") || q.includes("best")) return [...menuItems].sort((a, b) => (b.orders_count || 0) - (a.orders_count || 0)).slice(0, 3);
    if (q.includes("cheap") || q.includes("affordable")) return [...menuItems].sort((a, b) => a.price - b.price).slice(0, 3);
    
    // Generic Keyword Search
    return menuItems.filter((p) => 
      p.name?.toLowerCase().includes(q) || 
      p.description?.toLowerCase().includes(q) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
    ).slice(0, 3);
  };

  const buildReply = (query, recs) => {
    if (recs === "GREETING") return "Hey there! How can I help you navigate our shop today? I can suggest products based on category or help you find our most popular items.";
    
    const q = query.toLowerCase();
    if (recs.length === 0) return "I couldn't find an exact match for that, but feel free to browse our full catalog! You can also ask about specific categories.";
    if (q.includes("popular") || q.includes("best")) return "Here are our most popular items right now:";
    if (q.includes("cheap") || q.includes("affordable")) return "Here are some of our most affordable options:";
    return `I found ${recs.length} recommendation${recs.length > 1 ? "s" : ""} for you. Hit **Propel** to add to cart:`;
  };

  const handleSend = async (customText = null) => {
    const text = (customText || userInput).trim();
    if (!text) return;

    const userMsg = { role: "user", content: text };
    // UI adaptation: keep same sender format for rendering
    const uiUserMsg = { sender: "user", text };
    
    setMessages((prev) => [...prev, uiUserMsg]);
    setUserInput("");
    setIsTyping(true);

    try {
      // 1. Checkout Handler (pre-AI check for speed)
      if (text.toLowerCase().includes("checkout") || text.toLowerCase().includes("pay")) {
        setMessages((prev) => [
          ...prev, 
          { 
            sender: "ai", 
            text: "Ready to finalize? Click below to proceed to the secure checkout page.",
            actions: [
                { label: "Proceed to Checkout", path: "/order" }
            ] 
          }
        ]);
        setIsTyping(false);
        return;
      }

      // 2. Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('sales-assistant', {
        body: { 
          messages: messages.map(m => ({ 
            role: m.sender === 'ai' ? 'assistant' : 'user', 
            content: m.text 
          })).concat([userMsg]),
          menuItems,
          shopId
        }
      });

      if (error) throw error;

      // 3. Extract recommendations from structured JSON
      const aiReply = data.reply || "I'm having trouble understanding, but I'm here to help!";
      const recommendedIds = data.recommended_product_ids || [];
      const recs = menuItems.filter(p => recommendedIds.includes(p.id)).slice(0, 3);
      
      const aiResponse = { 
        sender: "ai", 
        text: aiReply, 
        recommendations: recs 
      };
      
      setMessages((prev) => [...prev, aiResponse]);
    } catch (err) {
      console.error("AI Error:", err);
      // Fallback to simple matching if AI fails (e.g. no API key yet)
      const recs = findProducts(text);
      const reply = buildReply(text, recs);
      setMessages((prev) => [...prev, { sender: "ai", text: `(Offline Mode) ${reply}`, recommendations: Array.isArray(recs) ? recs : [] }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handlePropel = (product) => {
    // Presentation logic: calls addItem() from useCart (CLIENT DATA LAYER)
    addItem(product);
    setMessages((prev) => [
      ...prev,
      {
        sender: "ai",
        text: `✅ Added **${product.name}** to your cart! Shall I find anything else, or are you ready to checkout?`,
      },
    ]);
  };

  return (
    <>
      {/* Restore / Open Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          id="sales-agent-open-btn"
          className="fixed bottom-6 right-6 z-[200] flex items-center gap-2 bg-green-700 text-white px-5 py-3 rounded-full shadow-2xl font-bold text-sm hover:bg-green-800 transition-all animate-bounce"
        >
          <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
          Sales Assistant
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div
          id="sales-agent-widget"
          className="fixed bottom-6 right-6 z-[200] w-[360px] max-h-[560px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-100 overflow-hidden"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {/* Header */}
          <div className="bg-green-700 px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xs ring-2 ring-green-900">
                SA
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">Sales Assistant</p>
                <p className="text-green-200 text-[10px]">Online — here to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-green-200 hover:text-white p-1 rounded-lg hover:bg-green-600 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-green-600 text-white rounded-tr-none"
                      : "bg-white text-gray-700 rounded-tl-none border border-gray-200 shadow-sm"
                  }`}
                >
                  {msg.text}

                  {/* Recommendations */}
                  {msg.recommendations?.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.recommendations.map((rec) => (
                        <div
                          key={rec.id}
                          className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-gray-800 text-xs truncate">{rec.name}</p>
                            <p className="text-[10px] text-gray-400">KSh {rec.price}</p>
                          </div>
                          <button
                            onClick={() => handlePropel(rec)}
                            className="shrink-0 bg-green-600 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded-lg hover:bg-green-700 transition"
                          >
                            Propel
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Actions (e.g., Checkout) */}
                  {msg.actions?.length > 0 && (
                    <div className="mt-3 flex flex-col gap-2">
                       {msg.actions.map((action, i) => (
                           <button
                             key={action.path}
                             onClick={() => {
                                 setIsOpen(false);
                                 navigate(action.path);
                             }}
                             className="w-full bg-green-600 text-white py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-green-700 transition shadow-sm"
                           >
                              {action.label}
                           </button>
                       ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 flex gap-1 shadow-sm">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Replies */}
          <div className="px-4 pt-3 pb-2 flex gap-2 overflow-x-auto scrollbar-hide shrink-0 bg-white border-t border-gray-100">
            {QUICK_REPLIES.map((qr) => (
              <button
                key={qr.query}
                onClick={() => handleSend(qr.query)}
                className="shrink-0 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full hover:bg-green-100 transition whitespace-nowrap"
              >
                {qr.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="px-4 pb-4 pt-2 bg-white shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about any product..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-200 transition"
              />
              <button
                onClick={() => handleSend()}
                className="bg-green-700 text-white p-2.5 rounded-xl hover:bg-green-800 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
