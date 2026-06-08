import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import MetaTags from "../components/MetaTags";

export default function FlaxSeedsSandbox() {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Define size variations
  const sizes = [
    { label: "50g", price: 150, sku: "FS50G" },
    { label: "100g", price: 280, sku: "FS100G" },
    { label: "250g", price: 600, sku: "FS250G" },
    { label: "500g", price: 1100, sku: "FS500G" },
  ];

  const [selectedSize, setSelectedSize] = useState(sizes[0]);

  // Tab state for detailed info
  const [activeTab, setActiveTab] = useState("overview");

  // Dynamic Schema Generation matching the selected size and price
  const productSchema = useMemo(() => {
    const originUrl = typeof window !== "undefined" ? window.location.origin : "https://www.yourshop.com";
    return {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": `Flax Seeds ${selectedSize.label}`,
      "image": [`${originUrl}/flax-seeds.png`],
      "description": `Premium flax seeds (${selectedSize.label}) rich in omega-3s and fiber. Perfect for smoothies, baking, and healthy living.`,
      "sku": selectedSize.sku,
      "brand": {
        "@type": "Brand",
        "name": "Mamarosy Health Grocery"
      },
      "offers": {
        "@type": "Offer",
        "url": typeof window !== "undefined" ? window.location.href : `${originUrl}/sandbox/flax-seeds`,
        "priceCurrency": "KES",
        "price": selectedSize.price.toString(),
        "availability": "https://schema.org/InStock",
        "itemCondition": "https://schema.org/NewCondition"
      }
    };
  }, [selectedSize]);

  const handleAddToCart = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800">
      <MetaTags
        title={`Buy Flax Seeds ${selectedSize.label} | Mamarosy Health Grocery`}
        description={`Premium whole golden flax seeds (${selectedSize.label}) rich in omega-3s and dietary fiber. Get it fresh from Mamarosy Health Grocery.`}
        ogImage="/flax-seeds.png"
        jsonLd={productSchema}
      />

      {/* Navigation Bar */}
      <header className="sticky top-0 bg-white/70 backdrop-blur-md z-40 border-b border-slate-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-700 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">
              SEO Sandbox
            </span>
          </div>

          <div className="w-8"></div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-6 pt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          
          {/* Left Column: Product Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-emerald-950/5 rounded-[2.5rem] overflow-hidden border border-emerald-900/10 group shadow-lg">
              <img
                src="/flax-seeds.png"
                alt={`Organic golden flax seeds (${selectedSize.label}) in a ceramic bowl - Mamarosy Health Grocery`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-wider text-emerald-800 shadow-sm border border-emerald-50">
                🌱 100% Organic
              </div>
            </div>
            
            {/* Visual Indicators */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-50 border border-emerald-100/50 p-4 rounded-3xl text-center">
                <span className="block text-xl mb-1">💪</span>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Protein</span>
                <span className="block text-sm font-bold text-emerald-800 mt-0.5">18.3g</span>
              </div>
              <div className="bg-amber-50 border border-amber-100/50 p-4 rounded-3xl text-center">
                <span className="block text-xl mb-1">🌾</span>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Fiber</span>
                <span className="block text-sm font-bold text-amber-800 mt-0.5">27.3g</span>
              </div>
              <div className="bg-indigo-50 border border-indigo-100/50 p-4 rounded-3xl text-center">
                <span className="block text-xl mb-1">❤️</span>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Omega-3</span>
                <span className="block text-sm font-bold text-indigo-800 mt-0.5">22.8g</span>
              </div>
            </div>
          </div>

          {/* Right Column: Details & Configuration */}
          <div className="space-y-8">
            <div>
              <Link
                to="/s/mamarosy"
                className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 hover:text-emerald-700 transition"
              >
                Mamarosy Health Grocery
              </Link>
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mt-2">
                Organic Flax Seeds
              </h1>
              <div className="flex items-center gap-3 mt-4">
                <span className="text-3xl font-black text-emerald-600">
                  KES {selectedSize.price}
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  In Stock
                </span>
              </div>
            </div>

            {/* Sibling Size Selector */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Select Package Size
              </h3>
              <div className="flex flex-wrap gap-3">
                {sizes.map((size) => {
                  const isSelected = selectedSize.label === size.label;
                  return (
                    <button
                      key={size.label}
                      onClick={() => setSelectedSize(size)}
                      className={`px-6 py-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center min-w-[100px] ${
                        isSelected
                          ? "bg-slate-900 border-slate-900 text-white shadow-md scale-105"
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <span className="font-extrabold text-sm uppercase tracking-tight">{size.label}</span>
                      <span className={`block text-[10px] mt-0.5 font-bold ${isSelected ? 'text-emerald-300' : 'text-emerald-600'}`}>
                        KES {size.price}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Purchase Controls */}
            <div className="flex items-center gap-4 bg-white p-3 rounded-[2rem] border border-slate-100 shadow-sm max-w-sm">
              <div className="flex items-center bg-slate-50 rounded-full p-1 border border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-full bg-white text-slate-800 font-extrabold flex items-center justify-center shadow-sm hover:bg-slate-100 active:scale-95 transition cursor-pointer select-none"
                >
                  —
                </button>
                <span className="w-10 text-center font-black text-sm text-slate-900 select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-10 h-10 rounded-full bg-white text-slate-800 font-extrabold flex items-center justify-center shadow-sm hover:bg-slate-100 active:scale-95 transition cursor-pointer select-none"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                className={`flex-1 h-12 rounded-full font-black uppercase tracking-wider text-[10px] shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${
                  added ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-black'
                }`}
              >
                {added ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    <span>Added to Basket</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    <span>Add • KES {(selectedSize.price * quantity).toLocaleString()}</span>
                  </>
                )}
              </button>
            </div>

            {/* Description Tabbed Info Area */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex border-b border-slate-100 text-xs font-black uppercase tracking-wider">
                {[
                  { id: "overview", label: "Overview" },
                  { id: "benefits", label: "Benefits" },
                  { id: "usage", label: "Usage" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-4 text-center border-b-2 transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? "border-emerald-600 text-emerald-800 bg-emerald-50/20"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-6 text-sm text-slate-600 leading-relaxed font-medium">
                {activeTab === "overview" && (
                  <p>
                    Premium flax seeds ({selectedSize.label}) rich in omega-3s and fiber. 
                    Perfect for smoothies, baking, and healthy living. Our seeds are carefully 
                    sourced and packaged under high hygiene standards to ensure freshness and purity.
                  </p>
                )}
                {activeTab === "benefits" && (
                  <ul className="space-y-2 list-disc list-inside text-slate-700">
                    <li><strong className="text-emerald-800">Omega-3 Fatty Acids:</strong> Supports heart and brain health.</li>
                    <li><strong className="text-emerald-800">Dietary Fiber:</strong> Enhances digestion and gut microbiome.</li>
                    <li><strong className="text-emerald-800">Lignans:</strong> Powerful antioxidants with protective properties.</li>
                    <li><strong className="text-emerald-800">Plant Protein:</strong> Great clean macronutrient source for active lifestyles.</li>
                  </ul>
                )}
                {activeTab === "usage" && (
                  <p className="italic">
                    "Add 1 to 2 tablespoons to smoothies, oatmeal, yogurt, baking mixes, or use 
                    ground flax seeds as a healthy vegan egg substitute in recipes."
                  </p>
                )}
              </div>
            </div>

            {/* Trust Badges Footer */}
            <div className="flex flex-wrap gap-2.5 pt-4 border-t border-slate-100">
              <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full text-[10px] font-bold text-slate-600 border border-slate-200/40">
                <span>🍳</span> Kitchen Approved
              </span>
              <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full text-[10px] font-bold text-slate-600 border border-slate-200/40">
                <span>🥬</span> Hygiene Certified
              </span>
              <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full text-[10px] font-bold text-slate-600 border border-slate-200/40">
                <span>⚡</span> Express Delivery Active
              </span>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
