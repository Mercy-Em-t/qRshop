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

const QUICK_REPLIES = [
  { label: "🧶 Show Yarns", query: "yarns" },
  { label: "🧵 Threads", query: "threads" },
  { label: "🔘 Buttons", query: "buttons" },
  { label: "📦 Fabrics", query: "fabrics" },
  { label: "📿 Beads", query: "beads" },
  { label: "🔥 What's popular?", query: "popular" },
];

export default function SalesAgentWidget({ menuItems = [], addItem }) {
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

  useEffect(() => {
    if (isOpen) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const findProducts = (query) => {
    const q = query.toLowerCase();
    if (q.includes("yarn")) return menuItems.filter((p) => p.category?.toLowerCase().includes("yarn")).slice(0, 3);
    if (q.includes("thread")) return menuItems.filter((p) => p.category?.toLowerCase().includes("thread")).slice(0, 3);
    if (q.includes("button")) return menuItems.filter((p) => p.category?.toLowerCase().includes("button")).slice(0, 3);
    if (q.includes("fabric") || q.includes("material")) return menuItems.filter((p) => p.category?.toLowerCase().includes("fabric")).slice(0, 3);
    if (q.includes("bead")) return menuItems.filter((p) => p.category?.toLowerCase().includes("bead")).slice(0, 3);
    if (q.includes("popular") || q.includes("best")) return [...menuItems].sort((a, b) => b.price - a.price).slice(0, 3);
    if (q.includes("cheap") || q.includes("affordable")) return [...menuItems].sort((a, b) => a.price - b.price).slice(0, 3);
    // Generic search
    return menuItems.filter((p) => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)).slice(0, 3);
  };

  const buildReply = (query, recs) => {
    const q = query.toLowerCase();
    if (recs.length === 0) return "I couldn't find an exact match, but feel free to browse the catalog! You can also ask about specific items.";
    if (q.includes("popular") || q.includes("best")) return "Here are our top-value wholesale picks:";
    if (q.includes("cheap") || q.includes("affordable")) return "Here are our most affordable wholesale options:";
    return `I found ${recs.length} great option${recs.length > 1 ? "s" : ""} for you. Click **Propel** to add directly to your cart:`;
  };

  const handleSend = (customText = null) => {
    const text = (customText || userInput).trim();
    if (!text) return;

    const userMsg = { sender: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setUserInput("");
    setIsTyping(true);

    setTimeout(() => {
      // Phase 48: Dedicated Checkout Handler
      if (text.toLowerCase().includes("checkout") || text.toLowerCase().includes("pay")) {
        setMessages((prev) => [
          ...prev, 
          { 
            sender: "ai", 
            text: "Ready to finalize? Click below to proceed to the secure checkout and place your order.",
            actions: [
                { label: "Proceed to Checkout", path: "/order" }
            ] 
          }
        ]);
        setIsTyping(false);
        return;
      }

      const recs = findProducts(text);
      const reply = buildReply(text, recs);
      setMessages((prev) => [...prev, { sender: "ai", text: reply, recommendations: recs }]);
      setIsTyping(false);
    }, 800);
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
