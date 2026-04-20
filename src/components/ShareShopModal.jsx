import { useState } from "react";

export default function ShareShopModal({ shop, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const shopUrl = `${window.location.origin}/s/${shop?.slug || shop?.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shopUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Order from ${shop?.name}`,
          text: `Check out ${shop?.name} on Modern Savannah!`,
          url: shopUrl,
        });
      } catch (err) {
        console.warn("Sharing failed", err);
      }
    } else {
      handleCopy();
      alert("Link copied to clipboard! (Web Share not supported on this browser)");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        <div className="bg-theme-main p-8 text-center relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
             <span className="text-3xl text-theme-accent">🔗</span>
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Share {shop?.name}</h3>
          <p className="text-theme-accent font-bold text-[10px] uppercase tracking-widest mt-1 opacity-80">Expand your reach instantly</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 break-all">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Shop Link</p>
            <p className="text-sm font-mono text-slate-600 bg-white p-3 rounded-xl border border-slate-100">{shopUrl}</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={handleShare}
              className="w-full bg-theme-main text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-slate-900 transition flex items-center justify-center gap-3 active:scale-95 group uppercase text-xs tracking-widest"
            >
              <span>🚀 Native Share</span>
            </button>
            
            <button 
              onClick={handleCopy}
              className={`w-full py-4 rounded-2xl font-black transition flex items-center justify-center gap-3 active:scale-95 uppercase text-xs tracking-widest ${
                copied ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-white border-2 border-slate-100 text-slate-500 hover:bg-slate-50 border-theme-main/10'
              }`}
            >
              <span>{copied ? '✅ Link Copied' : '📋 Copy Link'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 justify-center py-2">
             <div className="h-[1px] bg-slate-100 flex-1"></div>
             <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em]">Modern Savannah Platform</span>
             <div className="h-[1px] bg-slate-100 flex-1"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
