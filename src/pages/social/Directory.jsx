import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import Footer from "../../components/Footer";
import Logo from "../../components/Logo";
import { supabase } from "../../services/supabase-client";
import EcosystemNav from "../../components/EcosystemNav";
import MetaTags from "../../components/MetaTags";
import ReportModal from "../../components/ReportModal";

export default function Directory() {
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndustry, setActiveIndustry] = useState("all");
  const [activeCommunity, setActiveCommunity] = useState("all"); 
  const [isSearching, setIsSearching] = useState(false);
  const [industryTypes, setIndustryTypes] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [regions, setRegions] = useState([]);
  const [activeRegion, setActiveRegion] = useState(localStorage.getItem('savannah_active_region') || "Nairobi");
  const [featuredShops, setFeaturedShops] = useState([]);
  const [communityShopIds, setCommunityShopIds] = useState(new Set()); 
  const [viewMode, setViewMode] = useState("products"); 
  const [reportingShop, setReportingShop] = useState(null);
  const [adverts, setAdverts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDirectory();
  }, []);

  useEffect(() => {
    if (activeCommunity === 'all') {
      setCommunityShopIds(new Set());
      return;
    }
    supabase.from('shop_communities').select('shop_id').eq('community_id', activeCommunity)
      .then(({ data }) => {
        if (data) setCommunityShopIds(new Set(data.map(r => r.shop_id)));
      });
  }, [activeCommunity]);

  const fetchDirectory = async () => {
    setLoading(true);
    
    // Fetch approved shops with trust metadata
    const { data: shopsData, error: shopsErr } = await supabase
      .from("shops")
      .select("id, name, subdomain, industry_type, marketplace_status, verification_level, trust_score, agent_id")
      .eq("marketplace_status", "approved")
      .order("trust_score", { ascending: false });

    if (!shopsErr && shopsData) {
      setShops(shopsData);
    }

    const { data: productsData, error: prodErr } = await supabase
      .from("menu_items")
      .select(`
         id, name, price, category, image_url, description, shop_id,
         shops!inner(id, name, subdomain, marketplace_status, industry_type, verification_level, trust_score)
      `)
      .eq("shops.marketplace_status", "approved")
      .order("created_at", { ascending: false })
      .limit(300);

    if (!prodErr && productsData) {
       setProducts(productsData);
    }

    const { data: indData } = await supabase.from("industry_types").select("slug, name");
    if (indData) setIndustryTypes(indData);

    const { data: commData } = await supabase.from('communities').select('id, name, slug').order('name');
    if (commData) setCommunities(commData);

    const { data: regionData } = await supabase.from('system_logistics_config').select('region_name').eq('is_active', true);
    if (regionData) setRegions(regionData);

    const { data: featData } = await supabase
      .from("shops")
      .select("id, name, subdomain, industry_type, verification_level")
      .eq("marketplace_status", "approved")
      .eq("plan", "business")
      .limit(5);
    if (featData) setFeaturedShops(featData);
    
    const { data: adsData } = await supabase.from("adverts").select("*").eq("is_active", true);
    if (adsData) setAdverts(adsData);

    setLoading(false);
  };

  const performSearch = async (query) => {
    setSearchQuery(query);
    if (!query || query.length < 2) {
      fetchDirectory();
      return;
    }

    setIsSearching(true);
    try {
      const { data: pData } = await supabase
        .from("menu_items")
        .select(`
           id, name, price, category, image_url, description, shop_id,
           shops!inner(id, name, subdomain, marketplace_status, industry_type, verification_level, trust_score)
        `)
        .textSearch("fts_vector", query, { config: 'english' })
        .eq("shops.marketplace_status", "approved")
        .limit(100);
      
      if (pData) setProducts(pData);

      const { data: sData } = await supabase
        .from("shops")
        .select("id, name, subdomain, industry_type, marketplace_status, verification_level, trust_score, agent_id")
        .ilike("name", `%${query}%`)
        .eq("marketplace_status", "approved");
      
      if (sData) setShops(sData);
    } catch (e) {
      console.error("Discovery Search Failed", e);
    } finally {
      setIsSearching(false);
    }
  };

  const getIndustryName = (slug) => {
     const ind = industryTypes.find(i => i.slug === slug);
     return ind ? ind.name : (slug || "Shop").toUpperCase();
  };

  const filteredShops = shops.filter(shop => {
      const matchesRegion = !activeRegion || shop.operational_region === activeRegion;
      const matchesIndustry = activeIndustry === "all" || shop.industry_type === activeIndustry;
      const matchesCommunity = activeCommunity === "all" || communityShopIds.has(shop.id);
      return matchesRegion && matchesIndustry && matchesCommunity;
  });

  const filteredProducts = products.filter(product => {
      const matchesRegion = !activeRegion || product.shops.operational_region === activeRegion;
      const matchesIndustry = activeIndustry === "all" || product.shops.industry_type === activeIndustry;
      const matchesCommunity = activeCommunity === "all" || communityShopIds.has(product.shop_id);
      return matchesRegion && matchesIndustry && matchesCommunity;
  });

  const VerificationBadge = ({ level }) => {
    if (level === 'unverified') return null;
    const colors = {
      bronze: 'bg-orange-100 text-orange-700',
      silver: 'bg-slate-100 text-slate-700',
      gold: 'bg-yellow-100 text-yellow-700 font-bold'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider ${colors[level] || 'bg-gray-100'}`}>
        {level}
      </span>
    );
  };

  const TrustStars = ({ score }) => {
    return (
      <div className="flex items-center gap-0.5 text-yellow-400">
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} className={star <= Math.round(score) ? 'opacity-100' : 'opacity-20 text-gray-400'}>★</span>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <header className="bg-white px-4 py-4 flex items-center justify-between shadow-sm z-50">
        <Link to="/" className="text-gray-400 hover:text-gray-800 font-bold transition-all text-sm">
           ← Savannah
        </Link>
        <Logo textClassName="font-black text-safari-green tracking-tighter text-lg uppercase italic" />
        <span className="text-savannah-ochre tracking-tighter font-bold text-sm ml-1 bg-savannah-ochre/10 px-2 py-0.5 rounded">Discovery</span>
        <div className="w-12"></div>
      </header>
      
      <EcosystemNav />

      {reportingShop && <ReportModal shop={reportingShop} onClose={() => setReportingShop(null)} />}

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 relative">
        <div className="mb-8 text-center sm:text-left">
           <h1 className="text-3xl sm:text-4xl font-black text-deep-ebony mb-2 tracking-tighter">The Modern Savannah.</h1>
           <p className="text-gray-500 text-lg font-medium">Native commerce, digitized for Africa and the World.</p>
        </div>

        {/* 🗺️ REGION SELECTOR */}
        <div className="mb-6 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
           {regions.map(r => (
              <button
                 key={r.region_name}
                 onClick={() => {
                    setActiveRegion(r.region_name);
                    localStorage.setItem('savannah_active_region', r.region_name);
                 }}
                 className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border-2 transition-all ${
                    activeRegion === r.region_name 
                    ? 'bg-safari-green border-safari-green text-white shadow-md scale-105' 
                    : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                 }`}
              >
                 📍 {r.region_name}
              </button>
           ))}
        </div>

        {/* 📢 AD SLOT: HEADER BANNER */}
        {adverts.find(ad => ad.placement === 'header') && (
           <div className="mb-8 rounded-3xl overflow-hidden shadow-lg border-4 border-white">
              {adverts.filter(ad => ad.placement === 'header').map(ad => (
                 <a key={ad.id} href={ad.target_url} target="_blank" rel="noopener noreferrer" className="block w-full">
                    <img src={ad.image_url} alt="Advertisement" className="w-full h-32 sm:h-48 object-cover" />
                 </a>
              ))}
           </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
           <div className="relative flex-1">
              {isSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-green-600 border-t-transparent animate-spin rounded-full"></div>}
              <input 
                 type="text"
                 placeholder="Search products, meals, or shops..."
                 value={searchQuery}
                 onChange={(e) => performSearch(e.target.value)}
                 className="w-full bg-white border-2 border-transparent focus:border-green-400 focus:ring-4 focus:ring-green-100 rounded-2xl py-3 pl-10 pr-4 outline-none transition shadow-sm text-gray-700 font-medium"
              />
           </div>

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

        {!searchQuery && featuredShops.length > 0 && (
           <div className="mb-10">
              <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                    <span className="text-yellow-500">✨</span> Featured Merchants
                 </h2>
                 <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Premium Collection</span>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                 {featuredShops.map(shop => (
                    <Link 
                       key={shop.id}
                       to={shop.subdomain ? `http://${shop.subdomain}.${window.location.host.split('.').slice(-2).join('.')}` : `/?shop=${shop.id}`}
                       className="shrink-0 w-64 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all snap-start group"
                    >
                       <div className="flex justify-between items-start mb-3">
                          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center text-xl font-black group-hover:bg-green-600 group-hover:text-white transition-colors">
                             {shop.name.charAt(0)}
                          </div>
                          <VerificationBadge level={shop.verification_level} />
                       </div>
                       <h4 className="font-bold text-gray-900 truncate">{shop.name}</h4>
                       <p className="text-xs text-slate-500 mb-4 capitalize">{getIndustryName(shop.industry_type)}</p>
                       <div className="flex items-center justify-between">
                          <TrustStars score={4.5} />
                          <span className="text-sm font-bold text-green-600 group-hover:translate-x-1 transition-transform">Visit →</span>
                       </div>
                    </Link>
                 ))}
              </div>
           </div>
        )}

        {communities.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Browse by Community</p>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
              <button
                onClick={() => setActiveCommunity("all")}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition-colors ${activeCommunity === 'all' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-teal-700 border-teal-200 hover:bg-teal-50'}`}
              >
                🌍 All Communities
              </button>
              {communities.map(c => (
                <button
                  key={c.id}
                  onClick={() => setActiveCommunity(c.id)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition-colors ${activeCommunity === c.id ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-teal-700 border-teal-200 hover:bg-teal-50'}`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

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

        {loading ? (
             <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
             </div>
        ) : viewMode === "shops" ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {filteredShops.map((shop) => (
                    <div key={shop.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group">
                        <div className={`h-32 w-full flex items-center justify-center p-6 bg-gradient-to-tr ${shop.industry_type === 'digital' ? 'from-indigo-500 to-purple-500' : shop.industry_type === 'retail' ? 'from-blue-500 to-cyan-500' : 'from-orange-400 to-amber-500'}`}>
                           <span className="text-3xl text-white font-black opacity-30 drop-shadow-md text-center line-clamp-2 leading-tight">
                              {shop.name.toUpperCase()}
                           </span>
                        </div>
                        <div className="p-5 flex-1 flex flex-col">
                           <div className="flex justify-between items-start mb-2">
                             <div className="flex-1">
                               <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-1">{shop.name}</h3>
                               <p className="text-xs text-slate-400 mt-1 uppercase tracking-tight">{getIndustryName(shop.industry_type)}</p>
                             </div>
                             <VerificationBadge level={shop.verification_level} />
                           </div>
                           
                           <div className="my-4 flex items-center justify-between">
                              <TrustStars score={shop.trust_score} />
                              <button 
                                onClick={(e) => { e.preventDefault(); setReportingShop(shop); }}
                                className="text-[10px] font-black text-gray-300 hover:text-red-400 uppercase tracking-widest transition"
                              >
                                Report
                              </button>
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
        ) : (
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                 {filteredProducts.map((p) => (
                    <Link 
                       key={p.id} 
                       to={p.shops?.subdomain ? `http://${p.shops.subdomain}.${window.location.host.split('.').slice(-2).join('.')}/buy/${encodeURIComponent(p.name)}` : `/buy/${encodeURIComponent(p.name)}?shop=${p.shop_id}`}
                       className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group cursor-pointer"
                    >
                        {p.image_url ? (
                           <div className="h-32 sm:h-48 w-full bg-gray-100 relative">
                              <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                              <div className="absolute top-2 right-2">
                                 <VerificationBadge level={p.shops?.verification_level} />
                              </div>
                           </div>
                        ) : (
                           <div className={`h-32 sm:h-48 w-full flex flex-col items-center justify-center p-4 bg-gradient-to-tr ${p.shops?.industry_type === 'digital' ? 'from-indigo-100 to-purple-50 text-indigo-300' : 'from-gray-100 to-gray-50 text-gray-300'} relative`}>
                              <span className="text-4xl sm:text-5xl mb-2">{p.shops?.industry_type === 'digital' ? '💻' : '🛍️'}</span>
                              <div className="absolute top-2 right-2">
                                 <VerificationBadge level={p.shops?.verification_level} />
                              </div>
                           </div>
                        )}
                        <div className="p-4 flex-1 flex flex-col">
                           <div className="mb-1">
                              <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-tight line-clamp-2 group-hover:text-green-600 transition">{p.name}</h3>
                           </div>
                           <div className="text-xs text-gray-500 line-clamp-1 mb-2 font-medium flex items-center justify-between">
                              <span>{p.shops?.name}</span>
                              <span className="text-yellow-500">★ {p.shops?.trust_score}</span>
                           </div>
                           <div className="mt-auto pt-3 border-t border-gray-50 flex items-end justify-between">
                              <div>
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
        )}
      </main>
      <Footer />
    </div>
  );
}
