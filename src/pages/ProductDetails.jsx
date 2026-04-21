import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMenuItemById } from "../services/menu-service";
import { useCart } from "../hooks/use-cart";
import { getQrSession } from "../utils/qr-session";
import { resolveShopIdentifier } from "../services/shop-service";

export default function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [item, setItem] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const itemData = await getMenuItemById(productId);
        if (!itemData) {
          setLoading(false);
          return;
        }
        setItem(itemData);

        const shopData = await resolveShopIdentifier(itemData.shop_id);
        setShop(shopData);
      } catch (err) {
        console.error("Error loading product details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [productId]);

  const handleAddToCart = () => {
    if (!item) return;
    addItem(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-secondary"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-950 p-6">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">Product Not Found</h1>
        <p className="text-gray-500 mb-8">The item you're looking for might have been moved or removed.</p>
        <button 
          onClick={() => navigate(-1)} 
          className="bg-gray-900 text-white px-8 py-3 rounded-full font-black uppercase tracking-widest"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20">
      {/* Hero Header */}
      <div className="relative h-[40vh] sm:h-[50vh] w-full overflow-hidden">
        <img 
          src={item.product_images?.[0]?.url || item.image_url} 
          alt={item.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
        
        {/* Top Actions */}
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center bg-gradient-to-b from-gray-900/40 to-transparent">
          <button 
            onClick={() => navigate(-1)}
            className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white ring-1 ring-white/30 hover:bg-white/30 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Floating Title Card */}
        <div className="absolute -bottom-1 left-0 w-full p-6">
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-6 rounded-3xl shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-1 block">
                  {item.category}
                </span>
                <h1 className="text-3xl font-black text-white leading-tight">
                  {item.name}
                </h1>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-green-400">
                  KSh {item.price}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in">
        {/* Description */}
        <section>
          <h2 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Product Overview</h2>
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
            {item.description || "A premium selection from " + (shop?.name || "our collection") + "."}
          </p>
        </section>

        {/* Dynamic Attributes Grid */}
        {item.attributes && Object.keys(item.attributes).length > 0 && (
          <section>
            <h2 className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Specifications</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.entries(item.attributes).map(([key, value]) => {
                if (!value || value === '-') return null;
                return (
                  <div key={key} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                    <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-1">
                      {key.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-100">
                      {String(value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Trust Factors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
           <div className="flex items-center gap-4 bg-green-50 dark:bg-green-900/10 p-5 rounded-3xl border border-green-100 dark:border-green-900/20">
              <div className="w-12 h-12 bg-green-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-green-500/20">
                 🛡️
              </div>
              <div>
                 <h4 className="font-black text-green-800 dark:text-green-400 text-sm italic">Authentic Guarantee</h4>
                 <p className="text-[11px] text-green-700/70 dark:text-green-400/60 font-bold uppercase tracking-wide">100% Sourced by {shop?.name || 'Modern Savannah'}</p>
              </div>
           </div>
           <div className="flex items-center gap-4 bg-blue-50 dark:bg-blue-900/10 p-5 rounded-3xl border border-blue-100 dark:border-blue-900/20">
              <div className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">
                 🚚
              </div>
              <div>
                 <h4 className="font-black text-blue-800 dark:text-blue-400 text-sm italic">Savannah Express</h4>
                 <p className="text-[11px] text-blue-700/70 dark:text-blue-400/60 font-bold uppercase tracking-wide">Dynamic Delivery Available</p>
              </div>
           </div>
        </div>
      </div>

      {/* Floating Bottom Navigator for Cart */}
      <div className="fixed bottom-0 left-0 w-full p-6 z-50">
        <div className="max-w-md mx-auto">
          <button 
            onClick={handleAddToCart}
            className={`w-full h-16 rounded-full font-black uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 ${
              added ? 'bg-green-500 text-white' : 'bg-gray-900 text-white hover:bg-black'
            }`}
          >
            {added ? (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                <span>Added to Basket</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                <span>Add to Basket</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
