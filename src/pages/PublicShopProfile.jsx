import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getShop } from "../services/shop-service";
import { getMenuItemsByCategory } from "../services/menu-service";

export default function PublicShopProfile({ directShopId }) {
  const params = useParams();
  const shopId = directShopId || params.shopId;
  const [shop, setShop] = useState(null);
  const [menuCategories, setMenuCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        
        // Update Title dynamically for SEO
        document.title = `${shopData.shop_name} - Menu & Ordering`;

        const menuData = await getMenuItemsByCategory(shopId);
        setMenuCategories(menuData);
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
    "name": shop.shop_name,
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
      {/* Insert JSON-LD Context */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero Section */}
      <div className="bg-indigo-600 text-white py-16 px-4 text-center">
        <div className="w-24 h-24 bg-white text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold shadow-lg">
          {shop.shop_name.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-4xl font-extrabold mb-2">{shop.shop_name}</h1>
        {shop.tagline ? <p className="text-indigo-100 mb-4">{shop.tagline}</p> : <p className="text-indigo-100 mb-4">Quality food & drinks, powered by Smart QR</p>}
        {shop.contact_number && <p className="text-indigo-200">📞 {shop.contact_number}</p>}
      </div>

      {/* Public Menu Preview */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-800">Our Menu Preview</h2>
          <p className="text-gray-500 mt-2">Visit us and scan our QR code at the table to order instantly.</p>
        </div>

        {Object.keys(menuCategories).length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm text-center border border-gray-100">
            <p className="text-gray-500">This shop is still updating their digital menu.</p>
          </div>
        ) : (
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
        )}
      </div>
      
      {/* Footer Call to Action */}
      <div className="bg-white py-12 text-center border-t border-gray-200 px-4">
        <p className="text-gray-500 text-sm mb-4">Want a smart menu for your own shop?</p>
        <Link to="/" className="inline-block bg-gray-900 text-white font-medium px-6 py-2 rounded-full hover:bg-gray-800 transition">
          Create your ShopQR Dashboard
        </Link>
      </div>
    </div>
  );
}
