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

export default function Menu() {
  const session = getQrSession();
  const navigate = useNavigate();
  const { shop, loading: shopLoading } = useShop(session?.shop_id);
  const { addItem, addBundle, itemCount } = useCart();
  const { categories, loading: menuLoading, isOffline } = useOfflineMenu();
  const [upsellItems, setUpsellItems] = useState([]);
  const [lastAddedItemId, setLastAddedItemId] = useState(null);
  const [showUpsell, setShowUpsell] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [bundles, setBundles] = useState([]);

  const terms = useNomenclature(session?.shop_id);
  const { campaigns } = useCampaigns(session?.shop_id);

  useEffect(() => {
     if (session?.shop_id) {
        fetchActiveBundles();
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

  // Metadata and Campaign memoization (Moved up to satisfy Rules of Hooks)
  const activeCampaign = useMemo(() => campaigns?.find(c => c.is_active), [campaigns]);

  // Flatten items for BundleCard retrieval
  const allMenuItems = useMemo(() => (categories ? Object.values(categories).flat() : []), [categories]);

  // GRACEFUL TIER DEGRADATION: Cap display items to 50 if Free tier or expired
  const displayCategories = useMemo(() => {
    const isFreeTier = shop?.plan === 'free' || (shop?.subscription_expires_at && new Date(shop.subscription_expires_at) < new Date());
    if (!isFreeTier || !categories) return categories;

    let count = 0;
    const limited = {};
    for (const cat of Object.keys(categories)) {
      const remaining = 50 - count;
      if (remaining <= 0) break;
      limited[cat] = categories[cat].slice(0, remaining);
      count += limited[cat].length;
      if (limited[cat].length >= remaining) break;
    }
    return limited;
  }, [categories, shop]);

  const categoryNames = useMemo(() => Object.keys(displayCategories || {}), [displayCategories]);
  const activeCat = activeCategory || categoryNames[0];

  if (isLoading) return <LoadingSpinner message="Loading menu..." />;

  // Extract unique categories for the scroller

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
        <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center justify-between">
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

        {/* Category Tab Bar */}
        {categoryNames.length > 1 && (
          <div className="flex overflow-x-auto gap-2 px-4 pb-2.5 scrollbar-hide">
            {categoryNames.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  document.getElementById(`cat-${cat}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
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
        )}
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
            <div className="max-w-lg mx-auto px-4">
               <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                 <span>🔥</span> Featured {terms.menu} Deals
               </h2>
               <div className="flex overflow-x-auto gap-4 snap-x pb-4 -mx-4 px-4 no-scrollbar">
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
      <main className="max-w-lg mx-auto px-4 py-6 flex-1 w-full">
        {categoryNames.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <span className="text-5xl block mb-4">🍽️</span>
            <p className="text-lg font-medium">No menu items yet</p>
            <p className="text-sm mt-1">Check back soon!</p>
          </div>
        ) : (
          categoryNames.map((category) => (
            <div key={category} id={`cat-${category}`} className="mb-8 scroll-mt-40">
              <h2 className="text-base font-bold text-gray-700 mb-3 border-b border-gray-200 pb-2 uppercase tracking-wide text-xs">
                {category}
              </h2>
              <div className="grid gap-3">
                {categories[category].map((item) => (
                  <MenuItem key={item.id} item={item} onAdd={handleAddItem} isShopOnline={shop?.is_online !== false} />
                ))}
              </div>
            </div>
          ))
        )}
      </main>
      <CouponWidget shopPlan={shop?.plan} campaign={activeCampaign} />

      {/* ── Branded Footer ── */}
      <footer className="bg-white border-t border-gray-100 mt-4 pt-6 pb-8 px-4">
        <div className="max-w-lg mx-auto">
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
      />
    </div>
  );
}
