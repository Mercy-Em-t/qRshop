import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase-client";
import EcosystemNav from "../../components/EcosystemNav";

export default function Directory() {
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndustry, setActiveIndustry] = useState("all");
  const [industryTypes, setIndustryTypes] = useState([]);
  const [viewMode, setViewMode] = useState("products"); // 'products' | 'shops'
  const navigate = useNavigate();

  useEffect(() => {
    fetchDirectory();
  }, []);

  const fetchDirectory = async () => {
    setLoading(true);
    
    // Fetch live shops actively operating on the platform (is_online = true)
    const { data: shopsData, error: shopsErr } = await supabase
      .from("shops")
      .select("id, name, subdomain, industry_type, is_online, offers_pickup, offers_delivery, offers_digital, list_in_global_marketplace")
      .eq("is_online", true)
      .eq("list_in_global_marketplace", true)
      .order("created_at", { ascending: false });

    if (!shopsErr && shopsData) {
      setShops(shopsData);
    }

    // Fetch live products pooling from active marketplace shops
    const { data: productsData, error: prodErr } = await supabase
      .from("menu_items")
      .select(`
         id, name, price, category, image_url, description, shop_id,
         shops!inner(id, name, subdomain, is_online, list_in_global_marketplace, industry_type)
      `)
      .eq("shops.is_online", true)
      .eq("shops.list_in_global_marketplace", true)
      .order("created_at", { ascending: false })
      .limit(300);

    if (!prodErr && productsData) {
       setProducts(productsData);
    }

    // Fetch dynamic master taxonomy for filter bubbles
    const { data: indData } = await supabase
      .from("industry_types")
      .select("slug, name");
      
    if (indData) {
      setIndustryTypes(indData);
    }

    setLoading(false);
  };

  const getIndustryName = (slug) => {
     const ind = industryTypes.find(i => i.slug === slug);
     return ind ? ind.name : (slug || "Shop").toUpperCase();
  };

  const filteredShops = shops.filter(shop => {
      const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesIndustry = activeIndustry === "all" || shop.industry_type === activeIndustry;
      return matchesSearch && matchesIndustry;
  });

  const filteredProducts = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            product.shops.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (product.category || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesIndustry = activeIndustry === "all" || product.shops.industry_type === activeIndustry;
      return matchesSearch && matchesIndustry;
  });

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <header className="bg-white px-4 py-4 flex items-center justify-between shadow-sm z-50">
        <Link to="/" className="text-gray-400 hover:text-gray-800 font-bold transition-all text-sm">
           ← Savannah
        </Link>
        <span className="font-bold text-gray-900 tracking-tight text-lg">Marketplace</span>
        <div className="w-12"></div> {/* Spacer for center alignment */}
      </header>
      
      <EcosystemNav />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 relative">
        {/* Discovery Layout */}
        <div className="mb-8 text-center sm:text-left">
           <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2 tracking-tight">Discover local gems.</h1>
           <p className="text-gray-500 text-lg">Order groceries, food, or digital services natively through Savannah.</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
           <div className="relative flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                 type="text"
                 placeholder="Search for a merchant or store..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-white border-2 border-transparent focus:border-green-400 focus:ring-4 focus:ring-green-100 rounded-2xl py-3 pl-10 pr-4 outline-none transition shadow-sm text-gray-700 font-medium"
              />
           </div>

           {/* Taxonomy Bubbles */}
           <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide py-1">
              <button 
                 onClick={() => setActiveIndustry("all")}
                 className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition-colors ${activeIndustry === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
              >
                 All
              </button>
              {industryTypes.map(ind => (
                 <button 
                    key={ind.slug}
                    onClick={() => setActiveIndustry(ind.slug)}
                    className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition-colors ${activeIndustry === ind.slug ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                 >
                    {ind.name}
                 </button>
              ))}
           </div>
        </div>

        {/* View Toggles */}
        <div className="flex justify-center mb-8">
           <div className="inline-flex bg-gray-200 rounded-xl p-1 shadow-inner">
              <button 
                onClick={() => setViewMode("products")}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'products' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                 🛒 Products & Services
              </button>
              <button 
                onClick={() => setViewMode("shops")}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${viewMode === 'shops' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                 🏪 Shops & Merchants
              </button>
           </div>
        </div>

        {/* Directory Grid */}
        {loading ? (
             <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
             </div>
        ) : viewMode === "shops" ? (
           filteredShops.length === 0 ? (
             <div className="bg-white border text-center py-20 rounded-3xl shadow-sm">
                <span className="text-4xl text-gray-300 mb-4 block">🏜️</span>
                <h3 className="text-xl font-bold text-gray-700 mb-1">No Shops Found</h3>
                <p className="text-gray-500">We couldn't find any operational merchants matching your criteria.</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {filteredShops.map((shop) => (
                    <div key={shop.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group">
                        
                        {/* Fake Shop Cover Image Generate (since shop has no cover currently) */}
                        <div className={`h-32 w-full flex items-center justify-center p-6 bg-gradient-to-tr ${shop.industry_type === 'digital' ? 'from-indigo-500 to-purple-500' : shop.industry_type === 'retail' ? 'from-blue-500 to-cyan-500' : 'from-orange-400 to-amber-500'}`}>
                           <span className="text-3xl text-white font-black opacity-30 drop-shadow-md text-center line-clamp-2 leading-tight">
                              {shop.name.toUpperCase()}
                           </span>
                        </div>

                        <div className="p-5 flex-1 flex flex-col">
                           <div className="flex justify-between items-start mb-2">
                             <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-1">{shop.name}</h3>
                             <span className="shrink-0 bg-green-100 text-green-700 text-[10px] uppercase tracking-wider font-extrabold px-2 py-1 rounded-md">Live</span>
                           </div>
                           
                           <p className="text-sm text-gray-500 mb-4 capitalize font-medium">{getIndustryName(shop.industry_type)}</p>
                           
                           {/* Fulfillment Chips */}
                           <div className="flex gap-1.5 flex-wrap mb-6">
                              {shop.offers_delivery && <span className="bg-gray-50 border border-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-semibold">Delivery</span>}
                              {shop.offers_pickup && <span className="bg-gray-50 border border-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-semibold">Pickup</span>}
                              {shop.offers_digital && <span className="bg-gray-50 border border-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-semibold">Digital</span>}
                              {!shop.offers_delivery && !shop.offers_pickup && !shop.offers_digital && <span className="bg-gray-50 border border-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-semibold">In-Store</span>}
                           </div>

                           <div className="mt-auto">
                              <Link 
                                to={shop.subdomain ? `http://${shop.subdomain}.${window.location.host.split('.').slice(-2).join('.')}` : `/?shop=${shop.id}`}
                                className="block w-full text-center bg-gray-50 hover:bg-green-600 text-gray-900 hover:text-white border border-gray-200 hover:border-green-600 font-bold py-3 rounded-xl transition duration-200"
                              >
                                Enter Store
                              </Link>
                           </div>
                        </div>
                    </div>
                 ))}
             </div>
           )
        ) : (
           filteredProducts.length === 0 ? (
             <div className="bg-white border text-center py-20 rounded-3xl shadow-sm">
                <span className="text-4xl text-gray-300 mb-4 block">🛍️</span>
                <h3 className="text-xl font-bold text-gray-700 mb-1">No Products Found</h3>
                <p className="text-gray-500">No products or services match your current search.</p>
             </div>
           ) : (
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                 {filteredProducts.map((p) => (
                    <Link 
                       key={p.id} 
                       to={p.shops?.subdomain ? `http://${p.shops.subdomain}.${window.location.host.split('.').slice(-2).join('.')}/buy/${encodeURIComponent(p.name)}` : `/buy/${encodeURIComponent(p.name)}?shop=${p.shop_id}`}
                       className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group cursor-pointer"
                    >
                        {p.image_url ? (
                           <div className="h-32 sm:h-48 w-full bg-gray-100">
                              <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                           </div>
                        ) : (
                           <div className={`h-32 sm:h-48 w-full flex flex-col items-center justify-center p-4 bg-gradient-to-tr ${p.shops?.industry_type === 'digital' ? 'from-indigo-100 to-purple-50 text-indigo-300' : 'from-gray-100 to-gray-50 text-gray-300'}`}>
                              <span className="text-4xl sm:text-5xl mb-2">{p.shops?.industry_type === 'digital' ? '💻' : p.shops?.industry_type === 'retail' ? '🛍️' : '🍽️'}</span>
                           </div>
                        )}

                        <div className="p-4 flex-1 flex flex-col">
                           <div className="mb-1">
                              <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight line-clamp-2 group-hover:text-green-600 transition">{p.name}</h3>
                           </div>
                           
                           <div className="text-xs text-gray-500 line-clamp-1 mb-2 font-medium flex items-center gap-1">
                              <span className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px]">🏬</span>
                              {p.shops?.name}
                           </div>
                           
                           <div className="mt-auto pt-3 border-t border-gray-50 flex items-end justify-between">
                              <div>
                                 <p className="text-xs text-gray-400 font-medium">Price</p>
                                 <p className="font-black text-gray-900 text-sm sm:text-base tracking-tight">KSh {p.price?.toLocaleString()}</p>
                              </div>
                              <span className="bg-gray-900 text-white rounded-lg w-8 h-8 flex items-center justify-center group-hover:bg-green-600 transition">
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                              </span>
                           </div>
                        </div>
                    </Link>
                 ))}
             </div>
           )
        )}
      </main>
    </div>
  );
}
