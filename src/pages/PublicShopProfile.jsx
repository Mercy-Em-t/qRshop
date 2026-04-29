import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { resolveShopIdentifier } from "../services/shop-service";
import { getMenuItems } from "../services/menu-service";
import { getCurrentUser } from "../services/auth-service";
import { logEvent } from "../services/telemetry-service";
import MetaTags from "../components/MetaTags";
import { createPublicSession } from "../utils/qr-session";

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
      try {
        const shopData = await resolveShopIdentifier(shopIdentifier);

        if (!shopData) {
          setError("Shop not found");
          return;
        }

        const items = await getMenuItems(shopData.id);

        setShop(shopData);
        
        // Log Telemetry: Direct Visit (Link in Bio / Share)
        // We log this as a general view event.
        logEvent("shop_profile_view", {
           shop_id: shopData.id,
           is_direct: !params.qrId // If there is no QR ID in the URL, it's a direct link
        });
        
        // Canonical Redirect: If accessed via UUID or old link, redirect to the current slug
        if (shopIdentifier !== shopData.slug && !directShopId) {
          navigate(`/s/${shopData.slug}`, { replace: true });
        }

        // Take first 4 items as featured
        setFeaturedItems(items.slice(0, 4));
      } catch (err) {
        setError("Failed to load shop profile.");
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
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>;
  if (error || !shop) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-950 p-4"><h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Shop Not Found</h1><button onClick={() => navigate("/")} className="mt-4 text-theme-secondary font-bold">Go Home</button></div>;

  // 3. Extract Dynamic Layout
  const config = shop.appearance_config || { layout: ["hero", "categories", "featured_grid", "value_props", "cta"] };
  const layout = config.layout || ["hero", "categories", "featured_grid", "value_props", "cta"];
  const theme = config.theme || {};

  return (
    <div className="min-h-screen bg-white selection:bg-indigo-500 selection:text-white" style={{
       '--primary-color': theme.primary_color || '#6366f1',
       '--secondary-color': theme.secondary_color || '#10b981',
       '--font-family': theme.font_family || 'Outfit'
    }}>
      <MetaTags 
        title={`${shop.name} | ${shop.tagline || 'Shop Online'}`} 
        description={shop.tagline || `Welcome to ${shop.name}. Browse our products and order online.`} 
      />

      {/* Power User CSS Injection */}
      {shop.custom_css && <style>{shop.custom_css}</style>}

      <main className="relative">
        {layout.map(sectionName => {
           const render = SectionRegistry[sectionName];
           return render ? render(shop, featuredItems) : null;
        })}
      </main>

      {/* Persistent Footer if not in layout */}
      {!layout.includes('footer') && <ShopFooter shop={shop} />}
    </div>
  );
}
