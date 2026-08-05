import { useState, useEffect, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getMenuItemById, getRelatedItems } from "../services/menu-service";
import { useCart } from "../hooks/use-cart";
import { resolveShopIdentifier } from "../services/shop-service";
import { getDetailImageUrl, getThumbnailUrl } from "../utils/image-utils";
import { slugify } from "../utils/slugify";
import MetaTags from "../components/MetaTags";
import { supabase } from "../services/supabase-client";

function parseSafePrice(val, fallback = 0) {
  if (val === undefined || val === null || val === '') return parseFloat(fallback) || 0;
  if (typeof val === 'number') {
    return isNaN(val) ? (parseFloat(fallback) || 0) : val;
  }
  const cleanStr = String(val).replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? (parseFloat(fallback) || 0) : parsed;
}

export default function ProductDetails() {
  const { productSlug, productId } = useParams();
  const navigate = useNavigate();
  const { addItem, itemCount } = useCart();
  const [item, setItem] = useState(null);
  const [shop, setShop] = useState(null);
  const [relatedItems, setRelatedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [siblingSizes, setSiblingSizes] = useState([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  
  // Tab state for detailed info
  const [activeTab, setActiveTab] = useState("overview");

  // Handle popstate backward navigation for gallery close
  useEffect(() => {
    const handlePopState = (e) => {
      if (isGalleryOpen) {
        setIsGalleryOpen(false);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isGalleryOpen]);

  const openFullscreenGallery = (idx) => {
    setGalleryIndex(idx);
    setIsGalleryOpen(true);
    window.history.pushState({ gallery: true }, "");
  };

  const closeFullscreenGallery = () => {
    setIsGalleryOpen(false);
    if (window.history.state?.gallery) {
      window.history.back();
    }
  };

  const trustBadges = useMemo(() => {
    const badges = [];
    const type = shop?.industry_type?.toLowerCase() || "";

    if (type.includes("food") || type.includes("restaurant") || type.includes("cafe")) {
      badges.push({ icon: "🍳", text: "Freshly Cooked" });
      badges.push({ icon: "🥬", text: "Hygiene Certified" });
      badges.push({ icon: "⚡", text: "Quick Serve" });
    } else if (type.includes("clothing") || type.includes("fashion") || type.includes("boutique")) {
      badges.push({ icon: "🧵", text: "Premium Sourced" });
      badges.push({ icon: "🛡️", text: "Authentic Design" });
      badges.push({ icon: "🚚", text: "Delivery Active" });
    } else if (type.includes("grocery") || type.includes("supermarket")) {
      badges.push({ icon: "🌱", text: "Fresh Harvest" });
      badges.push({ icon: "🧼", text: "Sanitized Packing" });
      badges.push({ icon: "🚚", text: "Delivery Active" });
    } else {
      badges.push({ icon: "🛡️", text: "Quality Guaranteed" });
      badges.push({ icon: "🚚", text: "Delivery Active" });
    }
    return badges;
  }, [shop?.industry_type]);

  const productSchema = useMemo(() => {
    if (!item) return null;
    const images = (item.product_images && item.product_images.length > 0)
      ? item.product_images.map(img => img.url)
      : (item.image_url ? [item.image_url] : []);
    
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": item.name,
      "image": images.map(url => getDetailImageUrl(url)),
      "description": item.description || `Buy ${item.name} online at ${shop?.name || "our store"}.`,
      "brand": {
        "@type": "Brand",
        "name": item.brand || shop?.name || "Savannah Platform"
      },
      "offers": {
        "@type": "Offer",
        "url": typeof window !== "undefined" ? window.location.href : "",
        "priceCurrency": "KES",
        "price": selectedVariation ? selectedVariation.price : item.price,
        "availability": "https://schema.org/InStock",
        "itemCondition": "https://schema.org/NewCondition"
      }
    };

    if (item.category) {
      schema.category = item.category;
    }
    return schema;
  }, [item, shop, selectedVariation]);

  useEffect(() => {
    async function loadData() {
      try {
        const itemData = await getMenuItemById(productId);
        if (!itemData) {
          setLoading(false);
          return;
        }

        // Unify attributes
        const unified = {
          ...itemData,
          price: parseSafePrice(itemData.price, 0),
          brand: itemData.brand || itemData.attributes?.brand,
          origin: itemData.origin || itemData.attributes?.origin,
          processing: itemData.processing || itemData.attributes?.processing,
          nutrition_info: itemData.nutrition_info || itemData.attributes?.nutrition_info,
          benefits: itemData.benefits || itemData.attributes?.benefits,
          usage_instructions: itemData.usage_instructions || itemData.attributes?.usage_instructions,
          recipe: itemData.recipe || itemData.attributes?.recipe,
          diet_tags: itemData.diet_tags && itemData.diet_tags.length > 0 ? itemData.diet_tags : (itemData.attributes?.diet_tags || [])
        };

        const expectedSlug = slugify(unified.name);
        if (productSlug !== expectedSlug) {
          navigate(`/product/${expectedSlug}/${productId}`, { replace: true });
        }

        setItem(unified);

        // Standalone Sibling Sizes mapping logic
        const baseNameMatch = unified.name.match(/^(.*?)\s*(\d+(?:\.\d+)?\s*(?:g|kg|ml|l|oz|pcs|pack))\s*$/i);
        if (baseNameMatch) {
          const baseName = baseNameMatch[1].trim();
          const { data: siblings } = await supabase
            .from('menu_items')
            .select('id, name, price')
            .eq('shop_id', unified.shop_id)
            .ilike('name', `${baseName}%`);
          
          if (siblings && siblings.length > 1) {
            const mappedSiblings = siblings.map(s => {
              const sMatch = s.name.match(/^(.*?)\s*(\d+(?:\.\d+)?\s*(?:g|kg|ml|l|oz|pcs|pack))\s*$/i);
              return {
                id: s.id,
                name: s.name,
                price: parseSafePrice(s.price, 0),
                label: sMatch ? sMatch[2].trim() : s.name
              };
            });
            mappedSiblings.sort((a, b) => {
              const parseWeight = (str) => {
                const num = parseFloat(str) || 0;
                const lower = str.toLowerCase();
                if (lower.includes('kg') || lower.includes('l')) return num * 1000;
                return num;
              };
              return parseWeight(a.label) - parseWeight(b.label);
            });
            setSiblingSizes(mappedSiblings);
          } else {
            setSiblingSizes([]);
          }
        } else {
          setSiblingSizes([]);
        }

        const varKey = Object.keys(unified.attributes || {}).find(k => Array.isArray(unified.attributes[k]));
        if (varKey && unified.attributes[varKey].length > 0) {
          const firstVal = unified.attributes[varKey][0];
          const normV = typeof firstVal === 'object' && firstVal !== null
            ? { label: firstVal.label || firstVal.name || "", price: parseSafePrice((firstVal.price !== undefined && firstVal.price !== null) ? firstVal.price : unified.price, unified.price) }
            : { label: String(firstVal), price: parseSafePrice(unified.price, 0) };
          setSelectedVariation({ key: varKey, ...normV });
        }

        const [shopData, related] = await Promise.all([
          resolveShopIdentifier(unified.shop_id),
          getRelatedItems(unified.shop_id, unified.category, productId)
        ]);
        
        setShop(shopData);
        setRelatedItems(related);
      } catch (err) {
        console.error("Error loading product details:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    window.scrollTo(0, 0);
  }, [productId, productSlug, navigate]);

  const handleAddToCart = () => {
    if (!item) return;
    
    const cartItem = {
      ...item,
      price: parseSafePrice(selectedVariation ? selectedVariation.price : item.price, 0),
      name: selectedVariation ? `${item.name} (${selectedVariation.label})` : item.name,
      variant_label: selectedVariation?.label,
      selected_options: selectedVariation ? { size: selectedVariation.label } : undefined
    };

    addItem(cartItem, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-slate-800">
        <h1 className="text-3xl font-black mb-2">Product Not Found</h1>
        <p className="text-slate-500 mb-8">The item you're looking for might have been moved or removed.</p>
        <button 
          onClick={() => navigate(-1)} 
          className="bg-slate-900 text-white px-8 py-3 rounded-full font-black uppercase tracking-widest"
        >
          Go Back
        </button>
      </div>
    );
  }

  const images = (item.product_images && item.product_images.length > 0) 
    ? item.product_images.map(img => img.url)
    : (item.image_url ? [item.image_url] : []);
    
  const currentPrice = selectedVariation ? selectedVariation.price : item.price;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800">
      <MetaTags
        title={`Buy ${item.name} | ${shop?.name || "Store"}`}
        description={item.description || `Buy ${item.name} online at ${shop?.name || "our store"}.`}
        ogImage={images[0]}
        jsonLd={productSchema}
      />

      {shop?.mpesa_till_number && (
        <div className="bg-emerald-600 text-white text-center py-2 px-4 text-[10px] sm:text-xs font-black tracking-widest uppercase z-50 sticky top-0 shadow-sm">
          🟢 Pay Securely via M-PESA Till: <span className="text-yellow-300">{shop.mpesa_till_number}</span>
        </div>
      )}

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
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/menu")}
              className="text-slate-600 hover:text-emerald-700 transition font-bold text-sm flex items-center gap-2"
              title="Store Menu"
            >
               Menu
            </button>
            <button 
              onClick={() => navigate("/cart")}
              className="relative text-slate-600 hover:text-emerald-700 transition"
              title="View Cart"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-sm font-extrabold border-2 border-slate-50">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">
          
          {/* Left Column: Product Image Gallery */}
          <div className="space-y-4">
            {images.length > 0 ? (
              <div 
                className="relative aspect-square md:aspect-[4/3] lg:aspect-[4/3] bg-white rounded-[2.5rem] overflow-hidden border border-slate-200/50 group shadow-lg cursor-pointer"
                onClick={() => openFullscreenGallery(0)}
              >
                <img
                  src={getDetailImageUrl(images[0])}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {item.diet_tags && item.diet_tags.length > 0 && (
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-wider text-emerald-800 shadow-sm border border-emerald-50">
                    🌱 {item.diet_tags[0]}
                  </div>
                )}
                {images.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-wider text-slate-800 shadow-sm border border-slate-50 flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                    +{images.length - 1} More
                  </div>
                )}
              </div>
            ) : (
               <div className="relative aspect-square md:aspect-[4/3] lg:aspect-[4/3] bg-slate-100 rounded-[2.5rem] overflow-hidden border border-slate-200/50 flex items-center justify-center text-slate-400">
                  <svg className="w-16 h-16 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
               </div>
            )}
          </div>

          {/* Right Column: Details & Configuration */}
          <div className="space-y-6">
            <div>
              <Link
                to={`/s/${shop?.slug || shop?.id || ''}`}
                className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 hover:text-emerald-700 transition"
              >
                {shop?.name || "Our Store"}
              </Link>
              <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mt-2 leading-tight">
                {item.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <span className="text-3xl font-black text-emerald-600">
                  KES {currentPrice}
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  In Stock
                </span>
              </div>
            </div>

            {/* Sibling Sizes / Variation Selector */}
            {(siblingSizes.length > 0 || Object.entries(item.attributes || {}).some(([_, v]) => Array.isArray(v))) && (
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Select Option
                </h3>
                
                {siblingSizes.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {siblingSizes.map((sib) => {
                      const isSelected = sib.id === productId;
                      return (
                        <button
                          key={sib.id}
                          onClick={() => {
                            if (!isSelected) navigate(`/product/${slugify(sib.name)}/${sib.id}`);
                          }}
                          className={`px-5 py-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center min-w-[90px] ${
                            isSelected
                              ? "bg-slate-900 border-slate-900 text-white shadow-md scale-105"
                              : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          <span className="font-extrabold text-sm uppercase tracking-tight">{sib.label}</span>
                          <span className={`block text-[10px] mt-0.5 font-bold ${isSelected ? 'text-emerald-300' : 'text-emerald-600'}`}>
                            KES {sib.price}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(item.attributes).map(([key, variations]) => {
                      if (!Array.isArray(variations)) return null;
                      return variations.map((v, i) => {
                        const normV = typeof v === 'object' && v !== null
                          ? { label: v.label || v.name || "", price: parseSafePrice((v.price !== undefined && v.price !== null) ? v.price : item.price, item.price) }
                          : { label: String(v), price: parseSafePrice(item.price, 0) };
                        
                        const isSelected = selectedVariation?.label === normV.label && selectedVariation?.key === key;

                        return (
                          <button
                            key={`${key}-${i}`}
                            onClick={() => setSelectedVariation({ key, ...normV })}
                            className={`px-5 py-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center min-w-[80px] ${
                              isSelected
                                ? "bg-slate-900 border-slate-900 text-white shadow-md scale-105"
                                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                            }`}
                          >
                            <span className="font-extrabold text-sm uppercase tracking-tight">{normV.label}</span>
                            {normV.price !== undefined && normV.price !== null && (
                              <span className={`block text-[10px] mt-0.5 font-bold ${isSelected ? 'text-emerald-300' : 'text-emerald-600'}`}>
                                KES {normV.price}
                              </span>
                            )}
                          </button>
                        );
                      });
                    })}
                  </div>
                )}
              </div>
            )}

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
                    <span>Add • KES {(currentPrice * quantity).toLocaleString()}</span>
                  </>
                )}
              </button>
            </div>

            {/* Description Tabbed Info Area */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex border-b border-slate-100 text-[10px] sm:text-xs font-black uppercase tracking-wider">
                {[
                  { id: "overview", label: "Overview" },
                  { id: "details", label: "Details" },
                  { id: "usage", label: "Usage/Benefits", hide: !item.usage_instructions && !item.benefits && !item.recipe }
                ].filter(t => !t.hide).map(tab => (
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
                  <div className="prose prose-slate max-w-none text-slate-600">
                    <p>{item.description || "A premium selection from " + (shop?.name || "our collection") + "."}</p>
                  </div>
                )}
                
                {activeTab === "details" && (
                  <div className="space-y-5">
                     {(item.brand || item.origin || item.category || item.sku) && (
                       <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                         {item.brand && <div><span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Brand</span><span className="text-sm font-bold text-slate-800">{item.brand}</span></div>}
                         {item.origin && <div><span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Origin</span><span className="text-sm font-bold text-slate-800">{item.origin}</span></div>}
                         {item.category && <div><span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Category</span><span className="text-sm font-bold text-slate-800">{item.category}</span></div>}
                         {item.sku && <div><span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">SKU</span><span className="text-sm font-bold text-slate-800">{item.sku}</span></div>}
                       </div>
                     )}
                     {item.nutrition_info && (
                       <div>
                         <strong className="text-slate-800 block mb-1">Nutrition Facts</strong>
                         <p>{item.nutrition_info}</p>
                       </div>
                     )}
                     {item.processing && (
                       <div>
                         <strong className="text-slate-800 block mb-1">Processing Method</strong>
                         <p>{item.processing}</p>
                       </div>
                     )}
                     {/* Legacy Attributes */}
                     {item.attributes && Object.entries(item.attributes).map(([key, value]) => {
                        if (!value || Array.isArray(value) || ['brand', 'origin', 'processing', 'nutrition_info', 'benefits', 'usage_instructions', 'diet_tags', 'recipe'].includes(key.toLowerCase())) return null;
                        return (
                          <div key={key}>
                            <strong className="text-slate-800 block mb-1 capitalize">{key.replace(/_/g, ' ')}</strong>
                            <p>{String(value)}</p>
                          </div>
                        );
                      })}
                      {(!item.nutrition_info && !item.processing && !item.attributes) && (
                         <p className="text-slate-400 italic">No additional details provided.</p>
                      )}
                  </div>
                )}

                {activeTab === "usage" && (
                  <div className="space-y-5">
                    {item.benefits && (
                      <div>
                        <strong className="text-emerald-800 block mb-1 flex items-center gap-1.5"><span className="text-lg">✨</span> Key Benefits</strong>
                        <p>{item.benefits}</p>
                      </div>
                    )}
                    {item.usage_instructions && (
                      <div>
                         <strong className="text-amber-800 block mb-1 flex items-center gap-1.5"><span className="text-lg">📖</span> Instructions</strong>
                         <p className="italic bg-amber-50 p-3 rounded-xl border border-amber-100/50">"{item.usage_instructions}"</p>
                      </div>
                    )}
                    {item.recipe && (
                      <div>
                         <strong className="text-indigo-800 block mb-1 flex items-center gap-1.5"><span className="text-lg">🍳</span> Serving Suggestion</strong>
                         <p className="bg-indigo-50 p-3 rounded-xl border border-indigo-100/50">{item.recipe}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Trust Badges Footer */}
            {trustBadges.length > 0 && (
              <div className="flex flex-wrap gap-2.5 pt-4 border-t border-slate-100">
                {trustBadges.map((badge, idx) => (
                  <span key={idx} className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full text-[10px] font-bold text-slate-600 border border-slate-200/40">
                    <span>{badge.icon}</span> {badge.text}
                  </span>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* Related Products Scroller */}
        {relatedItems.length > 0 && (
           <section className="mt-16 pt-8 border-t border-slate-200">
            <div className="flex justify-between items-end mb-6">
               <div>
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Customers also bought</h2>
                  <h3 className="text-xl font-black text-slate-800 italic">Complete the set</h3>
               </div>
               <Link to="/menu" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline decoration-2 underline-offset-4 transition">View All</Link>
            </div>
            <div className="flex overflow-x-auto gap-5 pb-6 -mx-6 px-6 no-scrollbar snap-x">
              {relatedItems.map((rItem) => (
                <div key={rItem.id} className="flex-shrink-0 w-44 snap-start group relative">
                  <Link 
                    to={`/product/${slugify(rItem.name)}/${rItem.id}`}
                    className="block"
                  >
                    <div className="relative aspect-square rounded-[2rem] overflow-hidden mb-3 shadow-sm border border-slate-100 bg-white">
                      <img 
                        src={getThumbnailUrl(rItem.product_images?.[0]?.url || rItem.image_url)} 
                        alt={rItem.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addItem({
                            ...rItem,
                            price: parseSafePrice(rItem.price, 0)
                          });
                          
                          const target = e.currentTarget;
                          const originalHtml = target.innerHTML;
                          target.style.backgroundColor = '#10B981'; 
                          target.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>';
                          setTimeout(() => {
                            target.style.backgroundColor = '';
                            target.innerHTML = originalHtml;
                          }, 1000);
                        }}
                        className="absolute bottom-3 right-3 w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-md active:scale-90 hover:scale-105 transition-all hover:bg-black cursor-pointer z-20"
                        title="Add to Cart"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 truncate px-1">{rItem.name}</h4>
                    <p className="text-sm font-black text-emerald-600 mt-1 px-1">KES {rItem.price}</p>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Dedicated Fullscreen Image Gallery Modal */}
      {isGalleryOpen && (
        <div className="fixed inset-0 bg-black/95 z-[999] flex flex-col justify-between p-4 animate-fade-in">
          <div className="flex justify-between items-center py-2 px-4 z-10">
            <button 
              onClick={closeFullscreenGallery}
              className="w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white ring-1 ring-white/20 transition cursor-pointer"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <span className="text-white/60 text-xs font-bold uppercase tracking-widest">
              Gallery ({galleryIndex + 1} / {images.length})
            </span>
            <div className="w-12"></div>
          </div>

          <div className="flex-1 w-full flex items-center justify-center overflow-hidden py-4">
            <div 
              className="w-full flex overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth h-full max-h-[70vh] items-center"
              onScroll={(e) => {
                const width = e.currentTarget.clientWidth;
                if (width > 0) {
                  const index = Math.round(e.currentTarget.scrollLeft / width);
                  setGalleryIndex(index);
                }
              }}
            >
              {images.map((url, idx) => (
                <div key={idx} className="w-full h-full flex-shrink-0 snap-center flex items-center justify-center p-2 relative">
                  <img 
                    src={getDetailImageUrl(url)} 
                    alt={`Fullscreen view ${idx + 1}`} 
                    className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pb-8 flex justify-center gap-2">
            {images.map((_, i) => (
              <div 
                key={i} 
                className={`h-2 rounded-full transition-all duration-300 ${galleryIndex === i ? 'w-8 bg-emerald-400' : 'w-2 bg-white/30'}`}
              ></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
