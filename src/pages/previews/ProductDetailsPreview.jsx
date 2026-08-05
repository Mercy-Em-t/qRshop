import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MetaTags from "../../components/MetaTags";

export default function ProductDetailsPreview() {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // MOCK DATA
  const shop = {
    name: "Mamarosy Health Grocery",
    mpesa_till_number: "123456"
  };

  const images = [
    "/flax-seeds.png",
    "/flax-seeds.png",
    "/flax-seeds.png"
  ];

  const item = {
    name: "Organic Flax Seeds",
    price: 600,
    description: "Premium flax seeds rich in omega-3s and fiber. Perfect for smoothies, baking, and healthy living. Our seeds are carefully sourced and packaged under high hygiene standards.",
    category: "Health Foods",
    brand: "Nature's Best",
    origin: "Kenya",
    sku: "FS-ORG-250",
    diet_tags: ["100% Organic", "Vegan"],
    nutrition_info: "Per 100g: 534 kcal, 18.3g Protein, 27.3g Fiber, 42.2g Fat (22.8g Omega-3).",
    processing: "Sun-dried and gently milled",
    benefits: "Supports heart health, improves digestion, and provides a powerful source of plant-based protein and antioxidants.",
    usage_instructions: "Add 1 to 2 tablespoons to smoothies, oatmeal, yogurt, baking mixes, or use ground flax seeds as a healthy vegan egg substitute in recipes."
  };

  const sizes = [
    { label: "50g", price: 150 },
    { label: "100g", price: 280 },
    { label: "250g", price: 600 },
    { label: "500g", price: 1100 }
  ];
  
  const [selectedSize, setSelectedSize] = useState(sizes[2]);

  const trustBadges = [
    { icon: "🍳", text: "Kitchen Approved" },
    { icon: "🥬", text: "Hygiene Certified" },
    { icon: "⚡", text: "Express Delivery Active" }
  ];

  const handleAddToCart = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800">
      <MetaTags title={`Preview: ${item.name}`} />

      {/* Navigation Bar */}
      <header className="sticky top-0 bg-white/70 backdrop-blur-md z-40 border-b border-slate-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/previews")}
            className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-700 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Hub
          </button>
          
          <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">
              Live Preview
            </span>
          </div>
          
          <div className="w-24"></div> {/* Spacer to center the badge roughly */}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">
          
          {/* Left Column: Product Image Gallery */}
          <div className="space-y-4">
            <div 
              className="relative aspect-square md:aspect-[4/3] lg:aspect-[4/3] bg-white rounded-[2.5rem] overflow-hidden border border-slate-200/50 group shadow-lg cursor-pointer"
              onClick={() => setIsGalleryOpen(true)}
            >
              <img
                src={images[0]}
                alt={item.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-wider text-emerald-800 shadow-sm border border-emerald-50">
                🌱 {item.diet_tags[0]}
              </div>
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-wider text-slate-800 shadow-sm border border-slate-50 flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
                +2 More
              </div>
            </div>
          </div>

          {/* Right Column: Details & Configuration */}
          <div className="space-y-6">
            <div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
                {shop.name}
              </span>
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mt-2 leading-tight">
                {item.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <span className="text-3xl font-black text-emerald-600">
                  KES {selectedSize.price}
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  In Stock
                </span>
              </div>
            </div>

            {/* Sizes */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Select Option
              </h3>
              <div className="flex flex-wrap gap-3">
                {sizes.map((size) => {
                  const isSelected = selectedSize.label === size.label;
                  return (
                    <button
                      key={size.label}
                      onClick={() => setSelectedSize(size)}
                      className={`px-5 py-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center min-w-[90px] ${
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
                <span className="w-10 text-center font-black text-sm text-slate-900 select-none">{quantity}</span>
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

            {/* Description Tabs */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex border-b border-slate-100 text-[10px] sm:text-xs font-black uppercase tracking-wider">
                {[
                  { id: "overview", label: "Overview" },
                  { id: "details", label: "Details" },
                  { id: "usage", label: "Usage/Benefits" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer ${
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
                  <p>{item.description}</p>
                )}
                {activeTab === "details" && (
                  <div className="space-y-5">
                     <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                       <div><span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Brand</span><span className="text-sm font-bold text-slate-800">{item.brand}</span></div>
                       <div><span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Origin</span><span className="text-sm font-bold text-slate-800">{item.origin}</span></div>
                       <div><span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Category</span><span className="text-sm font-bold text-slate-800">{item.category}</span></div>
                       <div><span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">SKU</span><span className="text-sm font-bold text-slate-800">{item.sku}</span></div>
                     </div>
                     <div><strong className="text-slate-800 block mb-1">Nutrition Facts</strong><p>{item.nutrition_info}</p></div>
                     <div><strong className="text-slate-800 block mb-1">Processing Method</strong><p>{item.processing}</p></div>
                  </div>
                )}
                {activeTab === "usage" && (
                  <div className="space-y-5">
                    <div><strong className="text-emerald-800 block mb-1 flex items-center gap-1.5"><span className="text-lg">✨</span> Key Benefits</strong><p>{item.benefits}</p></div>
                    <div><strong className="text-amber-800 block mb-1 flex items-center gap-1.5"><span className="text-lg">📖</span> Instructions</strong><p className="italic bg-amber-50 p-3 rounded-xl border border-amber-100/50">"{item.usage_instructions}"</p></div>
                  </div>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2.5 pt-4 border-t border-slate-100">
              {trustBadges.map((badge, idx) => (
                <span key={idx} className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full text-[10px] font-bold text-slate-600 border border-slate-200/40">
                  <span>{badge.icon}</span> {badge.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Gallery Modal */}
      {isGalleryOpen && (
        <div className="fixed inset-0 bg-black/95 z-[999] flex flex-col justify-between p-4 animate-fade-in">
          <div className="flex justify-between items-center py-2 px-4 z-10">
            <button onClick={() => setIsGalleryOpen(false)} className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white ring-1 ring-white/20 transition cursor-pointer">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Gallery</span>
            <div className="w-12"></div>
          </div>
          <div className="flex-1 flex items-center justify-center p-8">
             <img src={images[0]} alt="Fullscreen" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
