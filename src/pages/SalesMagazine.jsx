import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { getCurrentUser } from "../services/auth-service";

export default function SalesMagazine() {
  const { identifier } = useParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const rawUser = getCurrentUser();
  const activeSessionShopId = rawUser?.shop_id || sessionStorage.getItem("active_shop_id") || null;

  useEffect(() => {
    fetchMagazineData();
  }, [identifier]);

  const fetchMagazineData = async () => {
    setLoading(true);
    // 1. Resolve Shop
    const { data: shopData } = await supabase
      .from("shops")
      .select("*")
      .or(`slug.eq.${identifier},shop_id.eq.${identifier}`)
      .single();

    if (shopData) {
      setShop(shopData);
      // 2. Fetch Products with Sales Pages
      const { data: productsData } = await supabase
        .from("menu_items")
        .select(`
          *,
          product_sales_pages (*)
        `)
        .eq("shop_id", shopData.shop_id)
        .eq("is_active", true)
        .order("category", { ascending: true });

      setProducts(productsData || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-indigo-300 font-black tracking-widest text-xs uppercase animate-pulse">Curating Magazine...</p>
        </div>
      </div>
    );
  }

  if (!shop || products.length === 0) {
    const isOwner = shop && (shop.shop_id === activeSessionShopId);
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center select-none font-sans selection:bg-indigo-500">
        <div className="max-w-xl mx-auto space-y-6">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 text-3xl mx-auto animate-bounce">
             📖
          </div>
          <h2 className="text-3xl font-black text-white leading-tight uppercase tracking-widest">
            {isOwner ? "Produce Your First Magazine" : "Magazine Under Curation"}
          </h2>
          <p className="text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
            {isOwner
              ? "Your shop hasn't generated any product sales copy for the digital magazine yet. Take a few seconds to build your first high-converting product catalog."
              : "This shop hasn't published their sales magazine yet. Please check back later!"}
          </p>

          {isOwner && (
            <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl p-6 border border-white/5 text-left space-y-4 max-w-lg mx-auto">
              <h3 className="text-xs font-black text-indigo-400 tracking-wider uppercase flex items-center gap-2">
                 📋 Getting Started Checklist
              </h3>
              <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed font-medium">
                 <div className="flex gap-3">
                   <span className="text-indigo-400 font-black">1.</span>
                   <p>Go to the <span className="text-white font-bold">Product Manager</span> in your dashboard.</p>
                 </div>
                 <div className="flex gap-3">
                   <span className="text-indigo-400 font-black">2.</span>
                   <p>Select any high-priority products you'd like to feature.</p>
                 </div>
                 <div className="flex gap-3">
                   <span className="text-indigo-400 font-black">3.</span>
                   <p>Click on <span className="text-white font-bold">Sales Copy</span>, and fill out the Headline, Sales Script, and Benefits Summary.</p>
                 </div>
                 <div className="flex gap-3">
                   <span className="text-indigo-400 font-black">4.</span>
                   <p>Click save! Your first high-converting product catalog will automatically publish here.</p>
                 </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {isOwner ? (
              <>
                <Link to="/a" className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-xl shadow-indigo-900/20">
                  ← Go to Dashboard
                </Link>
                <Link to="/a/products" className="bg-white/10 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/20 transition border border-white/10">
                  Product Manager
                </Link>
              </>
            ) : (
              <Link to="/" className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-xl shadow-indigo-900/20">
                Return Home
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentProduct = products[activeIndex];
  const salesPage = currentProduct.product_sales_pages;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500 selection:text-white overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
         <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px]"></div>
         <div className="absolute top-1/2 -right-24 w-80 h-80 bg-emerald-600/10 rounded-full blur-[100px]"></div>
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center backdrop-blur-md bg-slate-950/50 border-b border-white/5">
         <div className="flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <div>
               <h1 className="text-sm font-black tracking-tighter uppercase">{shop.name}</h1>
               <p className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">Sales Magazine 2026</p>
            </div>
         </div>
         <Link to={`/s/${identifier}`} className="text-[10px] font-black uppercase tracking-widest bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full border border-white/10 transition">
            Exit to Shop
         </Link>
      </nav>

      {/* Main Magazine View */}
      <main className="pt-24 min-h-screen flex flex-col lg:flex-row relative">
         
         {/* Sidebar Navigation (Thumbnails) */}
         <aside className="w-full lg:w-24 bg-black/40 backdrop-blur-sm order-2 lg:order-1 flex lg:flex-col overflow-x-auto lg:overflow-y-auto border-t lg:border-t-0 lg:border-r border-white/5 p-4 gap-4 scrollbar-hide">
            {products.map((p, idx) => (
               <button 
                  key={p.id}
                  onClick={() => setActiveIndex(idx)}
                  className={`shrink-0 w-16 h-16 rounded-xl border-2 transition-all duration-300 overflow-hidden ${activeIndex === idx ? 'border-indigo-500 scale-110 shadow-lg shadow-indigo-500/20' : 'border-transparent opacity-40 hover:opacity-100'}`}
               >
                  <img src={p.image_url || 'https://via.placeholder.com/150'} alt="" className="w-full h-full object-cover" />
               </button>
            ))}
         </aside>

         {/* Hero Product Page */}
         <div className="flex-1 order-1 lg:order-2 p-6 lg:p-12 overflow-y-auto animate-in fade-in zoom-in-95 duration-500">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
               
               {/* Left: Product Visuals */}
               <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                     <img 
                        src={currentProduct.image_url || 'https://via.placeholder.com/400'} 
                        alt={currentProduct.name} 
                        className="w-full h-full object-cover"
                     />
                     <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                        <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-2 inline-block">Featured Item</span>
                        <h2 className="text-3xl font-black text-white">{currentProduct.name}</h2>
                     </div>
                  </div>
               </div>

               {/* Right: Sales Copy */}
               <div className="space-y-8">
                  <div className="space-y-4">
                     <p className="text-indigo-400 font-black uppercase text-xs tracking-widest">{salesPage?.headline || `${currentProduct.name} Essentials`}</p>
                     <h3 className="text-4xl lg:text-5xl font-black leading-tight">
                        {currentProduct.brand ? `${currentProduct.brand} ${currentProduct.name}` : currentProduct.name}
                     </h3>
                     <div className="w-20 h-1.5 bg-indigo-500 rounded-full"></div>
                  </div>

                  <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 space-y-4">
                     <p className="text-lg text-slate-300 italic leading-relaxed">
                        "{salesPage?.sales_script || currentProduct.description}"
                     </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Benefits</p>
                        <p className="text-sm font-medium leading-relaxed">{salesPage?.benefits_summary || currentProduct.benefits || 'High quality natural ingredients.'}</p>
                     </div>
                     <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Origin & Processing</p>
                        <p className="text-sm font-medium">{currentProduct.origin || 'Locally Sourced'} — {currentProduct.processing || 'Organic Process'}</p>
                     </div>
                  </div>

                  {currentProduct.diet_tags?.length > 0 && (
                     <div className="flex flex-wrap gap-2">
                        {currentProduct.diet_tags.map(tag => (
                           <span key={tag} className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-500/20">
                              ✔ {tag}
                           </span>
                        ))}
                     </div>
                  )}

                  <div className="pt-8 flex items-center justify-between border-t border-white/5">
                     <div>
                        <p className="text-3xl font-black text-white">KSh {currentProduct.price}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Immediate Delivery</p>
                     </div>
                     <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 transform hover:-translate-y-1">
                        Add to Cart
                     </button>
                  </div>
               </div>

            </div>
         </div>

      </main>

      {/* Pagination Dot Indicator */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 hidden lg:flex gap-2 z-50">
         {products.map((_, idx) => (
            <button 
               key={idx}
               onClick={() => setActiveIndex(idx)}
               className={`w-2 h-2 rounded-full transition-all duration-300 ${activeIndex === idx ? 'w-8 bg-indigo-500' : 'bg-white/20 hover:bg-white/40'}`}
            />
         ))}
      </div>

    </div>
  );
}
