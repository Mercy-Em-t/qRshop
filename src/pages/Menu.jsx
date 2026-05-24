import { useMemo, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getQrSession } from "../utils/qr-session";
import { getUpsellItems } from "../services/menu-service";
import { trackUpsell } from "../services/analytics-service";
import { useShop } from "../hooks/use-shop";
import { useCart } from "../hooks/use-cart";
import { useOfflineMenu } from "../hooks/use-offline-menu";
import MenuItem from "../components/MenuItem";
import UpsellModal from "../components/UpsellModal";
import LoadingSpinner from "../components/LoadingSpinner";
import OfflineAlert from "../components/OfflineAlert";
import CouponWidget from "../components/CouponWidget";
import BundleCard from "../components/BundleCard";
import { useNomenclature } from "../hooks/use-nomenclature";
import { useCampaigns } from "../hooks/useCampaigns";
import { supabase } from "../services/supabase-client";
import { getCurrentUser } from "../services/auth-service";
import SalesAgentWidget from "../components/SalesAgentWidget";
import { fuzzyMatchProducts } from "../utils/fuzzy-search";
import CartComponent from "../components/Cart";
import MetaTags from "../components/MetaTags";
import { getGoogleMetadata } from "../services/seo-service";

export default function Menu() {
  const session = getQrSession();
  const navigate = useNavigate();
  const { shop, loading: shopLoading } = useShop(session?.shop_id);
  const { items, addItem, removeItem, total, addBundle, itemCount } = useCart();
  const { categories, loading: menuLoading, isOffline } = useOfflineMenu();
  const [upsellItems, setUpsellItems] = useState([]);
  const [seoConfig, setSeoConfig] = useState(null);
  const [lastAddedItemId, setLastAddedItemId] = useState(null);
  const [showUpsell, setShowUpsell] = useState(false);
  const [bundles, setBundles] = useState([]);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('qr_menu_view_mode') || 'grid');
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState({});

  const terms = useNomenclature(session?.shop_id);
  const { campaigns } = useCampaigns(session?.shop_id);

  // Metadata and Campaign memoization
  const activeCampaign = useMemo(() => campaigns?.find(c => c.is_active), [campaigns]);

  // Flatten items for BundleCard retrieval
  const allMenuItems = useMemo(() => (categories ? Object.values(categories).flat() : []), [categories]);

  // GRACEFUL TIER DEGRADATION: Cap display items to 50 if Free tier or expired
  const displayCategories = useMemo(() => {
    let currentCats = categories;
    
    // Apply Search Filter First
    if (searchQuery && categories) {
        currentCats = {};
        const q = searchQuery.toLowerCase().trim();
        let hasDirectMatches = false;

        // 1. Direct Search Matching
        for (const [cat, items] of Object.entries(categories)) {
            const filtered = items.filter(i => 
                i.name?.toLowerCase().includes(q) || 
                i.description?.toLowerCase().includes(q) ||
                (i.diet_tags && i.diet_tags.some(t => t.toLowerCase().includes(q)))
            );
            if (filtered.length > 0) {
                currentCats[cat] = filtered;
                hasDirectMatches = true;
            }
        }

        // 2. Fuzzy Typo Matching Fallback (if no direct matches are found anywhere in catalog)
        if (!hasDirectMatches) {
            const fuzzyMatches = fuzzyMatchProducts(allMenuItems, searchQuery);
            if (fuzzyMatches.length > 0) {
                fuzzyMatches.forEach(item => {
                    const cat = item.category || "Uncategorized";
                    if (!currentCats[cat]) {
                        currentCats[cat] = [];
                    }
                    currentCats[cat].push(item);
                });
            }
        }
    }

    const isFreeTier = shop?.plan === 'free' || (shop?.subscription_expires_at && new Date(shop.subscription_expires_at) < new Date());
    if (!isFreeTier || !currentCats) return currentCats;

    let count = 0;
    const limited = {};
    for (const cat of Object.keys(currentCats)) {
      const remaining = 50 - count;
      if (remaining <= 0) break;
      limited[cat] = currentCats[cat].slice(0, remaining);
      count += limited[cat].length;
      if (limited[cat].length >= remaining) break;
    }
    return limited;
  }, [categories, shop, searchQuery, allMenuItems]);

  const categoryNames = useMemo(() => Object.keys(displayCategories || {}), [displayCategories]);
  const activeCat = activeCategory || categoryNames[0];

  // Collapsible drawers expand and URL routing logic
  useEffect(() => {
    if (categoryNames.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const targetCategory = params.get("category");
      
      const initialCollapseState = {};
      categoryNames.forEach(cat => {
        // Expand the target category if it matches the query param, otherwise collapse it by default
        initialCollapseState[cat] = targetCategory ? cat.toLowerCase() !== targetCategory.toLowerCase() : true;
      });
      setCollapsedCategories(initialCollapseState);

      // Smooth scroll target category into view
      if (targetCategory) {
        const match = categoryNames.find(c => c.toLowerCase() === targetCategory.toLowerCase());
        if (match) {
          setTimeout(() => {
            document.getElementById(`cat-${match}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 300);
        }
      }
    }
  }, [categoryNames]);
  useEffect(() => {
     if (session?.shop_id) {
        fetchActiveBundles();
        getGoogleMetadata('shop', session.shop_id)
          .then(data => setSeoConfig(data))
          .catch(err => console.error("Failed to fetch menu SEO:", err));
     }
  }, [session?.shop_id]);

  const fetchActiveBundles = async () => {
     try {
        const { data } = await supabase
          .from('promotions')
          .select('*, promotion_items(*)')
          .eq('shop_id', session.shop_id)
          .eq('is_active', true)
          .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
        
        if (data) setBundles(data);
     } catch (err) {
        console.error("Failed to fetch bundles:", err);
     }
  };

  useEffect(() => {
     if (shop) {
        if (shop.subdomain?.toLowerCase() === 'atelier' || shop.name?.toLowerCase().includes('atelier')) {
           const user = getCurrentUser();
           if (!user) {
              sessionStorage.setItem('return_to', '/menu');
              navigate('/login?exclusive=true', { replace: true });
           }
        }
     }
  }, [shop, navigate]);

  const handleAddItem = async (item) => {
    addItem(item);
    setLastAddedItemId(item.id);

    try {
      const upsells = await getUpsellItems(item.id);
      if (upsells.length > 0) {
        const upsellMenuItems = upsells.map((u) => u.menu_items).filter(Boolean);
        if (upsellMenuItems.length > 0) {
          setUpsellItems(upsellMenuItems);
          setShowUpsell(true);
        }
      }
    } catch {
      // Silently ignore upsell errors
    }
  };

  const handleClaimBundle = (bundle, items) => {
     addBundle(bundle, items);
     navigate("/cart"); // Direct to cart to see savings!
  };

  const handleUpsellAccept = (item) => {
    addItem(item);
    if (lastAddedItemId) trackUpsell(lastAddedItemId, item.id, true);
    setShowUpsell(false);
    setUpsellItems([]);
    setLastAddedItemId(null);
  };

  const handleUpsellDecline = () => {
    if (lastAddedItemId && upsellItems.length > 0) {
      for (const uItem of upsellItems) trackUpsell(lastAddedItemId, uItem.id, false);
    }
    setShowUpsell(false);
    setUpsellItems([]);
    setLastAddedItemId(null);
  };

  const isLoading = shopLoading || menuLoading;

  const shopEmoji = useMemo(() => {
    const type = shop?.industry_type?.toLowerCase() || "";
    if (type.includes("food") || type.includes("restaurant") || type.includes("cafe")) return "🍽️";
    if (type.includes("clothing") || type.includes("fashion") || type.includes("boutique")) return "🛍️";
    if (type.includes("grocery") || type.includes("supermarket")) return "🛒";
    if (type.includes("electronics") || type.includes("tech")) return "📱";
    if (type.includes("beauty") || type.includes("salon")) return "💅";
    return "📦"; // Default retail/generic shop
  }, [shop?.industry_type]);

  if (isLoading) return <LoadingSpinner showLogo={true} message="Loading menu..." />;

  // Extract unique categories for the scroller

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <MetaTags
        title={seoConfig?.json_ld?.name ? `${seoConfig.json_ld.name} Menu | ${shop?.name || "Shop"}` : `${shop?.name || "Shop"} Menu | Order Online`}
        description={seoConfig?.json_ld?.description || shop?.tagline || `Browse the menu of ${shop?.name || "our shop"} and place your order online.`}
        jsonLd={seoConfig?.json_ld}
      />
      {/* ── Shop Header with Logo ── */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        {/* Shop Identity Bar */}
        <div className="bg-theme-main text-white px-4 py-3 flex items-center gap-3 justify-between">
          <Link to={shop?.id ? `/shops/${shop.id}` : '#'} className="flex w-full items-center gap-3 active:opacity-75 transition-opacity">
            {shop?.logo_url ? (
              <img
                src={shop.logo_url}
                alt={shop?.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-white/40 flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-xl flex-shrink-0 border-2 border-white/40">
                {(shop?.name || "S").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold truncate leading-tight">{shop?.name || "Shop"}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                 <span className="text-[10px] font-black uppercase bg-white/20 px-1.5 py-0.5 rounded tracking-widest leading-none">
                    {shop?.industry_type || 'Retail'}
                 </span>
                 {shop?.tagline && (
                    <p className="text-xs text-theme-accent-hover truncate">{shop.tagline}</p>
                 )}
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className={`w-2 h-2 rounded-full ${shop?.is_online !== false ? 'bg-green-300 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-xs text-theme-accent">{shop?.is_online !== false ? 'Open' : 'Closed'}</span>
          </div>
        </div>
        {/* Action Bar */}
        <div className="max-w-lg md:max-w-3xl lg:max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
             {(shop?.industry_type === 'food' || shop?.industry_type === 'restaurant') ? (
                <p className="text-xs text-gray-500 font-medium">
                   📍 {terms.table} {session?.table || "Counter"}
                </p>
             ) : (
                <p className="text-xs text-gray-500 font-medium">
                   🛒 Online Store
                </p>
             )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/history")}
              className="text-gray-500 hover:text-gray-800 text-xs font-medium transition-colors"
            >
              My Orders
            </button>
            <button
              onClick={() => navigate("/cart")}
              disabled={shop?.is_online === false}
              className={`relative px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm transition-colors ${shop?.is_online === false ? 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-80' : 'bg-theme-secondary text-white hover:bg-theme-main cursor-pointer'}`}
            >
              🛒 Cart
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center shadow-sm border border-white font-bold">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-lg md:max-w-3xl lg:max-w-7xl mx-auto px-4 pb-3">
          <div className="relative">
             <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
             </span>
             <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${terms.menu?.toLowerCase() || 'menu'}...`}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-theme-secondary focus:bg-white transition-all outline-none"
             />
          </div>
        </div>

        {/* Category & View Toggle Bar */}
        <div className="max-w-lg md:max-w-3xl lg:max-w-7xl mx-auto flex items-center justify-between px-4 pb-2.5">
           <div className="flex overflow-x-auto gap-2 scrollbar-hide flex-1 mr-4">
              {categoryNames.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    setCollapsedCategories(prev => ({ ...prev, [cat]: false }));
                    setTimeout(() => {
                      document.getElementById(`cat-${cat}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 50);
                  }}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                    activeCat === cat
                      ? "bg-theme-secondary text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
           </div>
           
           <div className="flex bg-gray-100 p-1 rounded-xl flex-shrink-0 border border-gray-200">
              <button 
                onClick={() => { setViewMode('grid'); localStorage.setItem('qr_menu_view_mode', 'grid'); }}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-theme-main shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
              </button>
              <button 
                onClick={() => { setViewMode('list'); localStorage.setItem('qr_menu_view_mode', 'list'); }}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-theme-main shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16"/></svg>
              </button>
           </div>
        </div>
      </header>

      {shop?.is_online === false && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 text-center">
          <p className="text-red-800 font-bold text-sm">🔴 Shop is currently Closed</p>
          <p className="text-red-600 text-xs mt-0.5">We are not accepting orders at this time. Please check back later.</p>
        </div>
      )}

      {isOffline && (
        <OfflineAlert message={`Showing cached ${terms.menu.toLowerCase()} — you appear to be offline`} />
      )}

      {/* ── Deals & Bundles Section ── */}
      {bundles.length > 0 && (
         <div className="bg-white border-b border-gray-100 pb-8 pt-4">
            <div className="max-w-lg md:max-w-3xl lg:max-w-7xl mx-auto px-4">
               <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                 <span>🔥</span> Featured {terms.menu} Deals
               </h2>
               <div className="flex overflow-x-auto gap-3 snap-x pb-4 -mx-4 px-4 no-scrollbar">
                  {bundles.map(bundle => (
                    <BundleCard 
                      key={bundle.id} 
                      bundle={bundle} 
                      menuItems={allMenuItems} 
                      onClaim={handleClaimBundle}
                    />
                  ))}
               </div>
            </div>
         </div>
      )}

      {/* ── Menu Items ── */}
      <main className="max-w-lg md:max-w-3xl lg:max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
         <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
            {/* Left Column: Menu Items */}
            <div className="lg:col-span-8">
               {categoryNames.length === 0 ? (
                 <div className="text-center py-16 text-gray-400 bg-white rounded-[2rem] border border-gray-100 shadow-xs">
                   <span className="text-5xl block mb-4">{shopEmoji}</span>
                   <p className="text-lg font-medium">No menu items yet</p>
                   <p className="text-sm mt-1">Check back soon!</p>
                 </div>
               ) : (
                 categoryNames.map((category) => {
                   const isCollapsed = collapsedCategories[category] && !searchQuery;
                   const items = displayCategories[category] || [];

                   return (
                     <div key={category} id={`cat-${category}`} className="mb-6 scroll-mt-40 bg-white rounded-[2rem] p-4 border border-gray-100 shadow-xs transition-all">
                       <button
                         onClick={() => setCollapsedCategories(prev => ({ ...prev, [category]: !prev[category] }))}
                         className="w-full flex items-center justify-between text-left text-base font-bold text-gray-700 uppercase tracking-wide text-xs group cursor-pointer py-1"
                       >
                         <span className="flex items-center gap-2">
                           <span className="font-extrabold">{category}</span>
                           <span className="text-[10px] text-gray-400 font-normal lowercase">({items.length} items)</span>
                         </span>
                         <span className={`text-[10px] text-gray-400 group-hover:text-gray-600 transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`}>
                           ▼
                         </span>
                       </button>
                       
                       {!isCollapsed && (
                         <div className={`mt-4 ${viewMode === "grid" ? "grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-1.5 sm:gap-4 animate-fade-in" : "grid gap-3 animate-fade-in"}`}>
                           {items.map((item) => (
                             <MenuItem 
                                key={item.id} 
                                item={item} 
                                onAdd={handleAddItem} 
                                isShopOnline={shop?.is_online !== false} 
                                isGridView={viewMode === "grid"}
                             />
                           ))}
                         </div>
                       )}
                     </div>
                   );
                 })
               )}
            </div>

            {/* Right Column: Sticky Cart Sidebar (Visible on Desktop only) */}
            <div className="hidden lg:block lg:col-span-4 sticky top-40 bg-white rounded-[2rem] p-6 border border-gray-100 shadow-xl">
               <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                  <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                     <span>🛒</span> Your Order
                  </h2>
                  <span className="bg-theme-secondary text-white text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                     {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </span>
               </div>
               
               <div className="max-h-[350px] overflow-y-auto pr-1 no-scrollbar">
                  <CartComponent
                     items={items}
                     onAdd={addItem}
                     onRemove={removeItem}
                     total={total}
                  />
               </div>
               
               {items.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-100 space-y-3">
                     {shop?.is_online === false && (
                        <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-semibold border border-red-100 text-center">
                           🔴 Shop is currently closed
                        </div>
                     )}
                     <button
                        onClick={() => navigate("/order")}
                        disabled={shop?.is_online === false}
                        className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-md hover:shadow-lg transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${shop?.is_online === false ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50' : 'bg-theme-accent text-theme-main hover:bg-theme-accent-hover'}`}
                     >
                        Confirm Order — KSh {total}
                     </button>
                  </div>
               )}
            </div>
         </div>
      </main>
      <CouponWidget shopPlan={shop?.plan} campaign={activeCampaign} />

      {/* ── Branded Footer ── */}
      <footer className="bg-white border-t border-gray-100 mt-4 pt-6 pb-8 px-4">
        <div className="max-w-lg md:max-w-3xl lg:max-w-7xl mx-auto">
          {/* App Brand */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="flex items-center gap-2 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-theme-secondary" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-bold text-gray-700 tracking-tight">Savannah</span>
            </div>
            <p className="text-xs text-gray-400">Smart QR Ordering Platform</p>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-3 gap-3 mb-5 text-center">
            <a href="https://wa.me/254700000000?text=Hi%2C+I+need+support" target="_blank" rel="noreferrer"
              className="flex flex-col items-center gap-1 text-gray-500 hover:text-theme-secondary transition-colors">
              <span className="text-lg">💬</span>
              <span className="text-xs font-medium">Support</span>
            </a>
            <Link to="/request-access"
              className="flex flex-col items-center gap-1 text-gray-500 hover:text-theme-secondary transition-colors">
              <span className="text-lg">🏪</span>
              <span className="text-xs font-medium">Get a Shop</span>
            </Link>
            <a href="/" className="flex flex-col items-center gap-1 text-gray-500 hover:text-theme-secondary transition-colors">
              <span className="text-lg">🌐</span>
              <span className="text-xs font-medium">About Us</span>
            </a>
          </div>

          {/* Legal */}
          <div className="flex justify-center gap-4 text-xs text-gray-400 mb-3">
            <Link to="/terms" className="hover:text-gray-600 transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-gray-600 transition-colors">Privacy</Link>
          </div>
          <p className="text-center text-xs text-gray-300">© 2026 Savannah Platform</p>
        </div>
      </footer>

      {showUpsell && (
        <UpsellModal
          upsellItems={upsellItems}
          onAccept={handleUpsellAccept}
          onDecline={handleUpsellDecline}
        />
      )}

      {/* ── Sales Agent Widget (Client-Side Presentation Layer) ── */}
      <SalesAgentWidget
        menuItems={allMenuItems}
        addItem={handleAddItem}
        shopId={session?.shop_id}
      />
    </div>
  );
}
