import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getShop } from "../services/shop-service";
import { getMenuItemsByCategory } from "../services/menu-service";
import { useNomenclature } from "../hooks/use-nomenclature";
import MetaTags from "../components/MetaTags";

export default function PublicShopProfile({ directShopId }) {
  const params = useParams();
  const navigate = useNavigate();
  const shopId = directShopId || params.shopId;
  const [shop, setShop] = useState(null);
  const [menuCategories, setMenuCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const terms = useNomenclature(shopId);

  useEffect(() => {
    async function loadShop() {
      try {
        const shopData = await getShop(shopId);
        if (!shopData) {
          setError("Shop not found");
          setLoading(false);
          return;
        }
        setShop(shopData);
        
        const menuData = await getMenuItemsByCategory(shopId);
        
        // GRACEFUL TIER DEGRADATION: Cap display items to 50 if Free tier or expired
        const isFreeTier = shopData.plan === 'free' || (shopData.subscription_expires_at && new Date(shopData.subscription_expires_at) < new Date());
        let displayCategories = menuData;
        
        if (isFreeTier && menuData) {
          let count = 0;
          displayCategories = {};
          for (const cat of Object.keys(menuData)) {
            const remaining = 50 - count;
            if (remaining <= 0) break;
            displayCategories[cat] = menuData[cat].slice(0, remaining);
            count += displayCategories[cat].length;
            if (displayCategories[cat].length >= remaining) break;
          }
        }
        
        setMenuCategories(displayCategories);
      } catch (err) {
        setError("Failed to load shop profile.");
      } finally {
        setLoading(false);
      }
    }
    loadShop();
  }, [shopId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Shop Not Found</h1>
        <p className="text-gray-500 mb-6">The shop you're looking for doesn't exist or has been removed.</p>
        <Link to="/" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700">Go Home</Link>
      </div>
    );
  }

  // Schema Markup for Google Indexing
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CafeOrCoffeeShop",
    "name": shop.name,
    "url": `https://www.shopqrplatform.com/shops/${shop.id}`,
    "telephone": shop.contact_number || "",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Nairobi",
      "addressRegion": "KE"
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MetaTags 
        title={`${shop.name} | Savannah Digital Menu`}
        description={shop.tagline || `Browse the latest menu and order directly from ${shop.name} using Savannah Smart QR.`}
      />
      {/* Insert JSON-LD Context */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero Section */}
      <div className="bg-indigo-600 text-white py-16 px-4 text-center relative">
        <button 
           onClick={() => navigate(-1)} 
           className="absolute top-4 left-4 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 backdrop-blur-sm transition shadow-sm"
        >
            ← Back
        </button>
        <div className="w-24 h-24 bg-white text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold shadow-lg mt-4">
          {shop.name.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-4xl font-extrabold mb-2">{shop.name}</h1>
        {shop.tagline ? <p className="text-indigo-100 mb-4">{shop.tagline}</p> : <p className="text-indigo-100 mb-4">Quality food & drinks, powered by Smart QR</p>}
        {shop.contact_number && <p className="text-indigo-200 mb-4">📞 {shop.contact_number}</p>}
        
        {shop.google_maps_url && (
            <a href={shop.google_maps_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-5 py-2.5 rounded-full font-bold transition shadow-sm border border-white/20">
               📍 Get Directions
            </a>
        )}
      </div>

      {/* Public Menu Preview */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-800">Our {terms.menu} Preview</h2>
          <p className="text-gray-500 mt-2">Visit us and scan our QR code at the {terms.table.toLowerCase()} to {terms.order.toLowerCase()} instantly.</p>
        </div>

        {Object.keys(menuCategories).length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm text-center border border-gray-100">
            <p className="text-gray-500">This shop is still updating their digital {terms.menu.toLowerCase()}.</p>
          </div>
        ) : (
          <>
            {/* Category Navigation - Scrollable on mobile */}
            {Object.keys(menuCategories).length > 0 && (
              <div className="flex overflow-x-auto gap-2 pb-4 mb-6 scrollbar-hide snap-x">
            {Object.keys(menuCategories).map((category, idx) => (
              <a 
                key={idx} 
                href={`#cat-${category}`}
                className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap hover:bg-gray-200 transition shrink-0 snap-start"
              >
                {category}
              </a>
            ))}
          </div>
        )}


          <div className="space-y-8">
            {Object.keys(menuCategories).map((cat) => (
              <div key={cat}>
                <h3 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">{cat}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {menuCategories[cat].map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-xl flex items-start gap-4 shadow-sm border border-gray-100 hover:shadow-md transition">
                      
                      {/* Thumbnail Placeholder or Image */}
                      {item.product_images && item.product_images.length > 0 && (
                         <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden relative border border-gray-100">
                            <img src={item.product_images[0].url} alt={item.name} className="w-full h-full object-cover" />
                            {item.product_images.length > 1 && (
                               <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-bold shadow-sm">
                                  +{item.product_images.length - 1}
                               </div>
                            )}
                         </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start gap-2">
                           <div>
                              <h4 className="font-semibold text-gray-800">{item.name}</h4>
                              <p className="text-sm font-bold text-indigo-600 mt-0.5">KSh {item.price}</p>
                           </div>
                           {item.product_link && (
                                <a href={item.product_link} target="_blank" rel="noreferrer" className="text-indigo-600 bg-indigo-50 p-2 rounded-lg hover:bg-indigo-100 transition shadow-sm flex-shrink-0" title="View Full Store / Buy">
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                     <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                     <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                   </svg>
                                </a>
                             )}
                          </div>

                          {item.description && <p className="text-sm text-gray-500 mt-2 line-clamp-2">{item.description}</p>}
                          
                          {(item.tags?.length > 0 || (item.variant_options && Object.keys(item.variant_options).length > 0)) && (
                             <div className="flex flex-wrap gap-1.5 mt-3">
                                {item.tags?.map((t, idx) => (
                                   <span key={idx} className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded tracking-wide uppercase border border-gray-200">{t}</span>
                                ))}
                                {item.variant_options && Object.keys(item.variant_options).slice(0, 2).map((vKey, idx) => (
                                   <span key={`v-${idx}`} className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded tracking-wide uppercase border border-indigo-100 flex items-center gap-1">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                                      Available {vKey}s
                                   </span>
                                ))}
                             </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Footer Call to Action */}
      <div className="bg-white py-10 sm:py-12 text-center border-t border-gray-200 px-4">
        <p className="text-gray-500 text-xs sm:text-sm mb-4">Want a smart {terms.menu.toLowerCase()} for your own business?</p>
        <Link to="/request-access" className="inline-block bg-gray-900 text-white font-medium px-6 py-3 sm:py-2 rounded-full hover:bg-gray-800 transition cursor-pointer text-sm sm:text-base">
          Create your ShopQR Dashboard
        </Link>
      </div>
    </div>
  );
}
