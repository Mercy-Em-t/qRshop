import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { resolveShopIdentifier } from "../services/shop-service";
import { getMenuItems } from "../services/menu-service";
import { getCurrentUser } from "../services/auth-service";
import { logEvent } from "../services/telemetry-service";
import MetaTags from "../components/MetaTags";
import { createPublicSession } from "../utils/qr-session";
import LoadingSpinner from "../components/LoadingSpinner";

// Shop Homepage Components
import ShopHero from "../components/shop/ShopHero";
import CategoryScroller from "../components/shop/CategoryScroller";
import ProductGrid from "../components/shop/ProductGrid";
import ValueProps from "../components/shop/ValueProps";
import ShopFooter from "../components/shop/ShopFooter";

export default function PublicShopProfile({ directShopId }) {
  const params = useParams();
  const navigate = useNavigate();
  const shopIdentifier = directShopId || params.identifier || params.shopId;
  const [shop, setShop] = useState(null);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function loadShopData() {
      // 1. Cache First Resolution
      try {
        const cachedShop = sessionStorage.getItem(`savannah_cached_shop_${shopIdentifier}`);
        const cachedItems = sessionStorage.getItem(`savannah_cached_items_${shopIdentifier}`);
        if (cachedShop && cachedItems) {
          setShop(JSON.parse(cachedShop));
          setFeaturedItems(JSON.parse(cachedItems).slice(0, 4));
          setLoading(false);
        }
      } catch (err) {
        // ignore cache failures
      }

      try {
        // 2. Fetch fresh data
        const shopData = await resolveShopIdentifier(shopIdentifier);

        if (!shopData) {
          setError("Shop not found");
          return;
        }

        // Parallel Data Fetching
        const [items] = await Promise.all([
           getMenuItems(shopData.id)
        ]);

        setShop(shopData);
        setFeaturedItems(items ? items.slice(0, 4) : []);
        
        // Log Telemetry: Direct Visit (Link in Bio / Share)
        logEvent("shop_profile_view", {
           shop_id: shopData.id,
           is_direct: !params.qrId 
        });
        
        // Update Cache
        try {
          sessionStorage.setItem(`savannah_cached_shop_${shopIdentifier}`, JSON.stringify(shopData));
          sessionStorage.setItem(`savannah_cached_items_${shopIdentifier}`, JSON.stringify(items || []));
        } catch (err) {
          // ignore cache writing limits
        }

        // Canonical Redirect
        if (shopIdentifier !== shopData.slug && !directShopId) {
          navigate(`/s/${shopData.slug}`, { replace: true });
        }
      } catch (err) {
        if (!shop) setError("Failed to load shop profile.");
      } finally {
        setLoading(false);
      }
    }
    loadShopData();
  }, [shopIdentifier, navigate]);

  // 1. Section Registry
  const SectionRegistry = {
    hero: (s, items) => <ShopHero key="hero" shop={s} />,
    categories: (s, items) => {
       const cats = Array.from(new Set(items.map(i => i.category))).map(cat => ({
         id: cat,
         name: cat,
         emoji: "📦"
       }));
       return <div key="categories" className="py-8"><CategoryScroller categories={cats} shopId={s.id} /></div>;
    },
    featured_grid: (s, items) => <ProductGrid key="grid" items={items} shopId={s.id} />,
    value_props: () => <ValueProps key="props" />,
    cta: (s) => (
      <div key="cta" className="text-center py-20 px-6 bg-slate-50 dark:bg-slate-900/50">
          <h2 className="text-3xl font-black mb-6 dark:text-white">Ready to explore?</h2>
          <button 
              onClick={() => {
                 if (s.id) {
                    createPublicSession(s.id);
                    navigate(`/menu`);
                 }
              }}
              className="bg-theme-secondary text-white px-12 py-5 rounded-full font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-indigo-500/20"
          >
              Enter Full Store
          </button>
      </div>
    ),
    footer: (s) => <ShopFooter key="footer" shop={s} />
  };

  // 2. Loading / Error States
  if (loading) return <LoadingSpinner showLogo={true} message="Accessing Storefront..." />;
  if (error || !shop) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-950 p-4"><h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Shop Not Found</h1><button onClick={() => navigate("/")} className="mt-4 text-theme-secondary font-bold">Go Home</button></div>;

  // 3. Extract Dynamic Layout — with hard defensive guards
  const SAFE_SECTIONS = ["hero", "categories", "featured_grid", "value_props", "cta", "footer"];
  const rawConfig = shop.appearance_config;
  const config    = (rawConfig && typeof rawConfig === "object") ? rawConfig : {};
  const rawLayout = Array.isArray(config.layout) ? config.layout : ["hero", "categories", "featured_grid", "value_props", "cta"];
  // Whitelist filter — unknown section names are silently dropped
  const layout    = rawLayout.filter(s => SAFE_SECTIONS.includes(s));
  const theme     = (config.theme && typeof config.theme === "object") ? config.theme : {};

  // Only inject CSS if it's a plain string (no script tag)
  const safeCss = (typeof shop.custom_css === "string" && !/(<script|javascript:)/i.test(shop.custom_css))
    ? shop.custom_css
    : "";

  return (
    <div className="min-h-screen bg-white selection:bg-indigo-500 selection:text-white" style={{
       '--primary-color':   theme.primary_color   || '#6366f1',
       '--secondary-color': theme.secondary_color || '#10b981',
       '--font-family':     theme.font_family      || 'Outfit'
    }}>
      <MetaTags
        title={`${shop.name} | ${shop.tagline || 'Shop Online'}`}
        description={shop.tagline || `Welcome to ${shop.name}. Browse our products and order online.`}
      />

      {/* Safe CSS Injection — sanitised before render */}
      {safeCss && <style>{safeCss}</style>}

      <main className="relative">
        {layout.map(sectionName => {
           // Each section is guarded — a crash in one section never breaks the others
           try {
             const render = SectionRegistry[sectionName];
             return render ? render(shop, featuredItems) : null;
           } catch (err) {
             console.warn(`[PublicShopProfile] Section "${sectionName}" failed to render:`, err);
             return null; // silently skip broken sections
           }
        })}
      </main>

      {/* Persistent Footer if not in layout */}
      {!layout.includes('footer') && <ShopFooter shop={shop} />}
    </div>
  );
}
