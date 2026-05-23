import { useState, useEffect, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getMenuItemById, getRelatedItems } from "../services/menu-service";
import { useCart } from "../hooks/use-cart";
import { getQrSession } from "../utils/qr-session";
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

        // Unify attributes (Check top-level first, fallback to JSONB attributes)
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

        // Canonical SEO Redirect check
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
            // Sort by numerical weight value for clean sequential listing
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

        // Auto-select first variation if any exist (local fallback attributes)
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
    
    // Create cart item with correct price and name if variation selected
    const cartItem = {
      ...item,
      price: parseSafePrice(selectedVariation ? selectedVariation.price : item.price, 0),
      name: selectedVariation ? `${item.name} (${selectedVariation.label})` : item.name,
      variant_label: selectedVariation?.label, // Extra metadata
      selected_options: selectedVariation ? { size: selectedVariation.label } : undefined
    };

    addItem(cartItem, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-secondary"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Product Not Found</h1>
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
    <div className="min-h-screen bg-gray-50 pb-20">
      <MetaTags
        title={`Buy ${item.name} | ${shop?.name || "Store"}`}
        description={item.description || `Buy ${item.name} online at ${shop?.name || "our store"}.`}
        ogImage={item.image_url || (item.product_images?.[0]?.url)}
        jsonLd={productSchema}
      />
      {/* Hero Header with Carousel */}
      <div className="relative h-[40vh] sm:h-[50vh] w-full overflow-hidden bg-gray-900 group">
        {(() => {
          const images = (item.product_images && item.product_images.length > 0) 
            ? item.product_images.map(img => img.url)
            : (item.image_url ? [item.image_url] : []);
            
          if (images.length === 0) return null;

          return (
            <>
              <div className="w-full h-full flex overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth">
                {images.map((url, idx) => (
                  <div key={idx} className="w-full h-full flex-shrink-0 snap-center relative cursor-pointer" onClick={() => openFullscreenGallery(idx)}>
                    <img 
                      src={getDetailImageUrl(url)} 
                      alt={`Buy ${item.name} online - ${item.category || "item"} image ${idx + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>

              {/* Dynamic Overlay View Gallery Button */}
              <button 
                onClick={() => openFullscreenGallery(0)}
                className="absolute bottom-24 right-6 bg-slate-900/80 backdrop-blur-md text-white border border-white/20 px-4.5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer z-10 hover:bg-slate-900"
              >
                🔍 View Gallery ({images.length})
              </button>
            </>
          );
        })()}
        
        {/* Pagination Dots (if multiple images) */}
        {(item.product_images && item.product_images.length > 1) && (
          <div className="absolute bottom-[20%] left-0 w-full flex justify-center gap-2 z-10 pointer-events-none">
             {item.product_images.map((_, i) => (
               <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/50 border border-white/20"></div>
             ))}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
        
        {/* Top Actions */}
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center bg-gradient-to-b from-gray-900/40 to-transparent z-10">
          <button 
            onClick={() => navigate(-1)}
            className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white ring-1 ring-white/30 hover:bg-white/30 transition cursor-pointer"
            title="Go Back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate("/menu")}
              className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white ring-1 ring-white/30 hover:bg-white/30 transition cursor-pointer"
              title="Store Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
            <button 
              onClick={() => navigate("/cart")}
              className="relative w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white ring-1 ring-white/30 hover:bg-white/30 transition cursor-pointer"
              title="View Cart"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-md font-extrabold border border-white">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Floating Title Card */}
        <div className="absolute -bottom-1 left-0 w-full p-6">
          <div className="bg-white/10 backdrop-blur-2xl border border-white/20 p-6 rounded-3xl shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-1 block">
                  {item.category}{item.subcategory ? ` • ${item.subcategory}` : ""}
                </span>
                <h1 className="text-3xl font-black text-white leading-tight">
                  {item.name}
                </h1>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-green-400">
                  KSh {selectedVariation ? selectedVariation.price : item.price}
                </span>
              </div>
            </div>
            {trustBadges.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-white/10">
                {trustBadges.map((badge, idx) => (
                  <span key={idx} className="flex items-center gap-1 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-bold text-white/90 border border-white/10">
                    <span>{badge.icon}</span>
                    <span>{badge.text}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8 animate-fade-in">
        {/* Standalone Sibling Sizes & Variation Selector */}
        {(siblingSizes.length > 0 || Object.entries(item.attributes || {}).some(([_, v]) => Array.isArray(v))) && (
          <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all animate-fade-in-up">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Choose your option</h2>
            
            {siblingSizes.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {siblingSizes.map((sib) => {
                  const isSelected = sib.id === productId;
                  return (
                    <button
                      key={sib.id}
                      onClick={() => {
                        if (!isSelected) {
                          navigate(`/product/${slugify(sib.name)}/${sib.id}`);
                        }
                      }}
                      className={`px-5 py-3 rounded-2xl font-bold transition-all border-2 text-xs cursor-pointer flex flex-col items-center min-w-[90px] ${
                        isSelected
                        ? "bg-slate-900 border-slate-900 text-white shadow-md scale-105"
                        : "bg-white border-gray-200 text-gray-600 hover:border-slate-300"
                      }`}
                    >
                      <span className="font-extrabold uppercase tracking-tight">{sib.label}</span>
                      <span className={`block text-[9px] mt-0.5 font-bold ${isSelected ? 'text-green-300' : 'text-theme-secondary'}`}>
                        KSh {sib.price}
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
                        className={`px-5 py-2.5 rounded-xl font-bold transition-all border-2 text-xs cursor-pointer flex flex-col items-center min-w-[80px] ${
                          isSelected
                          ? "bg-slate-900 border-slate-900 text-white shadow-md scale-105"
                          : "bg-white border-gray-200 text-gray-600 hover:border-slate-300"
                        }`}
                      >
                        <span className="font-extrabold">{normV.label}</span>
                        {normV.price !== undefined && normV.price !== null && (
                          <span className={`block text-[9px] opacity-75 mt-0.5 ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                            KSh {normV.price}
                          </span>
                        )}
                      </button>
                    );
                  });
                })}
              </div>
            )}
          </section>
        )}

        {/* Featured Description Section */}
        <section className="bg-white rounded-[2rem] p-6 sm:p-8 border border-gray-100 shadow-sm animate-fade-in-up">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <span>📝</span> Product Overview
          </h2>
          <div className="prose prose-slate max-w-none">
            <p className="text-base text-gray-700 leading-relaxed font-medium">
              {item.description || "A premium selection from " + (shop?.name || "our collection") + "."}
            </p>
          </div>
          {item.recipe && (
            <div className="mt-6 pt-5 border-t border-gray-100">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <span>🍳</span> Suggestions & Serving
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {item.recipe}
              </p>
            </div>
          )}
        </section>

        {/* Details & Specs Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Main Specifications */}
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Brand", value: item.brand },
                { label: "Origin", value: item.origin },
                { label: "Processing", value: item.processing },
                { label: "Nutrition", value: item.nutrition_info },
                { label: "SKU", value: item.sku }
              ].map(spec => spec.value && (
                <div key={spec.label} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block mb-1">{spec.label}</span>
                  <span className="text-sm font-bold text-gray-800">{spec.value}</span>
                </div>
              ))}
                
                {/* Legacy / Dynamic Attributes */}
                {item.attributes && Object.entries(item.attributes).map(([key, value]) => {
                  if (!value || Array.isArray(value) || ['brand', 'origin', 'processing', 'nutrition_info', 'benefits', 'usage_instructions', 'diet_tags'].includes(key.toLowerCase())) return null;
                  return (
                    <div key={key} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block mb-1">{key.replace('_', ' ')}</span>
                      <span className="text-sm font-bold text-gray-800">{String(value)}</span>
                    </div>
                  );
                })}
              </div>


            {item.diet_tags && item.diet_tags.length > 0 && (
              <div>
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Dietary Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {item.diet_tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded-full border border-green-100 uppercase tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Detailed Info (Benefits & Usage) */}
          <div className="space-y-6">
            {item.benefits && (
              <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-3">Key Benefits</h2>
                <p className="text-sm font-medium text-indigo-900 leading-relaxed">
                  {item.benefits}
                </p>
              </div>
            )}
            
            {item.usage_instructions && (
              <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                <h2 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-3">Usage & Preparation</h2>
                <p className="text-sm font-medium text-amber-900 leading-relaxed italic">
                  "{item.usage_instructions}"
                </p>
              </div>
            )}
          </div>
        </section>



        {/* Related Products Scroller */}
        {relatedItems.length > 0 && (
           <section className="pt-8 border-t border-gray-100">
            <div className="flex justify-between items-end mb-6">
               <div>
                  <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Customers also bought</h2>
                  <h3 className="text-xl font-black text-gray-800 italic">Complete the set</h3>
               </div>
               <Link to="/menu" className="text-xs font-bold text-theme-secondary underline decoration-2 underline-offset-4">View All</Link>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-4 -mx-6 px-6 no-scrollbar snap-x">
              {relatedItems.map((rItem) => (
                <div key={rItem.id} className="flex-shrink-0 w-40 snap-start group relative">
                  <Link 
                    to={`/product/${slugify(rItem.name)}/${rItem.id}`}
                    className="block"
                  >
                    <div className="relative aspect-square rounded-3xl overflow-hidden mb-3 shadow-sm border border-gray-100 bg-gray-50">
                      <img 
                        src={getThumbnailUrl(rItem.product_images?.[0]?.url || rItem.image_url)} 
                        alt={rItem.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
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
                          
                          // Quick inline tactile visual indicator on button
                          const target = e.currentTarget;
                          const originalHtml = target.innerHTML;
                          target.style.backgroundColor = '#10B981'; // Green confirmation
                          target.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>';
                          setTimeout(() => {
                            target.style.backgroundColor = '';
                            target.innerHTML = originalHtml;
                          }, 1000);
                        }}
                        className="absolute bottom-2.5 right-2.5 w-8 h-8 bg-theme-secondary text-white rounded-full flex items-center justify-center shadow-md active:scale-90 hover:scale-105 transition-all hover:bg-theme-main cursor-pointer z-20"
                        title="Add to Cart"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                    <h4 className="text-xs font-bold text-gray-800 truncate">{rItem.name}</h4>
                    <p className="text-sm font-black text-theme-secondary mt-0.5">KSh {rItem.price}</p>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Floating Bottom Navigator for Cart */}
      <div className="fixed bottom-0 left-0 w-full p-6 z-50">
        <div className="max-w-md mx-auto bg-white/80 backdrop-blur-xl border border-gray-100 rounded-3xl p-3 shadow-2xl flex items-center gap-3">
          {/* Quantity Selector Pill */}
          <div className="flex items-center bg-gray-100 rounded-full p-1.5 border border-gray-200">
            <button 
              type="button"
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              className="w-10 h-10 rounded-full bg-white text-gray-800 font-extrabold flex items-center justify-center shadow-sm hover:bg-gray-50 active:scale-90 transition cursor-pointer select-none"
            >
              —
            </button>
            <span className="w-10 text-center font-black text-sm text-gray-900 select-none">
              {quantity}
            </span>
            <button 
              type="button"
              onClick={() => setQuantity(q => q + 1)}
              className="w-10 h-10 rounded-full bg-white text-gray-800 font-extrabold flex items-center justify-center shadow-sm hover:bg-gray-50 active:scale-90 transition cursor-pointer select-none"
            >
              +
            </button>
          </div>

          {/* Add to Basket Action */}
          <button 
            onClick={handleAddToCart}
            className={`flex-1 h-13 rounded-full font-black uppercase tracking-wider text-[10px] shadow-md transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${
              added ? 'bg-green-500 text-white' : 'bg-slate-900 text-white hover:bg-black'
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
                <span>Add • KSh {((selectedVariation ? selectedVariation.price : item.price) * quantity).toLocaleString()}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dedicated Fullscreen Image Gallery Modal */}
      {isGalleryOpen && (() => {
        const images = (item.product_images && item.product_images.length > 0) 
          ? item.product_images.map(img => img.url)
          : (item.image_url ? [item.image_url] : []);
        return (
          <div className="fixed inset-0 bg-black/95 z-[999] flex flex-col justify-between p-4 animate-fade-in">
            {/* Header Close */}
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
              <div className="w-12"></div> {/* spacer */}
            </div>

            {/* Swipeable Scroll Track */}
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
                      alt={`Buy ${item.name} online - fullscreen view ${idx + 1}`} 
                      className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination Indicators */}
            <div className="pb-8 flex justify-center gap-2">
              {images.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-2 rounded-full transition-all duration-300 ${galleryIndex === i ? 'w-8 bg-green-400' : 'w-2 bg-white/30'}`}
                ></div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
