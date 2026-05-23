import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { resolveShopIdentifier } from "../services/shop-service";
import { getMenuItems } from "../services/menu-service";
import { getCurrentUser } from "../services/auth-service";
import { logEvent } from "../services/telemetry-service";
import MetaTags from "../components/MetaTags";
import { createPublicSession } from "../utils/qr-session";
import LoadingSpinner from "../components/LoadingSpinner";
import { getGoogleMetadata } from "../services/seo-service";

// Shop Homepage Components
import ShopHero from "../components/shop/ShopHero";
import CategoryScroller from "../components/shop/CategoryScroller";
import ProductGrid from "../components/shop/ProductGrid";
import ValueProps from "../components/shop/ValueProps";
import ShopFooter from "../components/shop/ShopFooter";

// Helper to select a diverse set of products across categories
function getFeaturedItems(items, config) {
  if (!items || items.length === 0) return [];
  
  // 1. Merchant explicitly selected items (if configured)
  const explicitIds = config?.featured_item_ids;
  if (Array.isArray(explicitIds) && explicitIds.length > 0) {
    const explicitItems = items.filter(i => explicitIds.includes(i.id));
    if (explicitItems.length > 0) return explicitItems.slice(0, 8);
  }
  
  // 2. Diversity Algorithm: pick 1 item from each category in a round-robin until 8
  const byCategory = {};
  items.forEach(item => {
    const cat = item.category || 'Uncategorized';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(item);
  });
  
  const diverse = [];
  const keys = Object.keys(byCategory);
  while (diverse.length < 8 && keys.some(k => byCategory[k].length > 0)) {
    for (const cat of keys) {
      if (diverse.length >= 8) break;
      if (byCategory[cat].length > 0) {
        diverse.push(byCategory[cat].shift());
      }
    }
  }
  return diverse;
}

export default function PublicShopProfile({ directShopId }) {
  const params = useParams();
  const navigate = useNavigate();
  const shopIdentifier = directShopId || params.identifier || params.shopId;
  const [shop, setShop] = useState(null);
  const [seoConfig, setSeoConfig] = useState(null);
  const [allItems, setAllItems] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConsent, setShowConsent] = useState(false);
  const [pendingShopId, setPendingShopId] = useState(null);
  
  useEffect(() => {
    async function loadShopData() {
      // 1. Cache First Resolution
      try {
        const cachedShop = sessionStorage.getItem(`savannah_cached_shop_${shopIdentifier}`);
        const cachedItems = sessionStorage.getItem(`savannah_cached_items_${shopIdentifier}`);
        if (cachedShop && cachedItems) {
          const parsedShop = JSON.parse(cachedShop);
          const parsedItems = JSON.parse(cachedItems);
          setShop(parsedShop);
          setAllItems(parsedItems);
          setFeaturedItems(getFeaturedItems(parsedItems, parsedShop?.appearance_config));
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
        const [items, seoData] = await Promise.all([
           getMenuItems(shopData.id),
           getGoogleMetadata('shop', shopData.id).catch(() => null)
        ]);

        setShop(shopData);
        setSeoConfig(seoData);
        setAllItems(items || []);
        setFeaturedItems(getFeaturedItems(items || [], shopData.appearance_config));
        
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
    hero: (s, fItems, allItems) => <ShopHero key="hero" shop={s} />,
    categories: (s, fItems, allItems) => {
       // Use ALL items to extract categories, not just the featured ones!
       const cats = Array.from(new Set((allItems || []).map(i => i.category).filter(Boolean))).map(cat => ({
         id: cat,
         name: cat,
         emoji: "📦"
       }));
       return <div key="categories" className="py-8"><CategoryScroller categories={cats} shopId={s.id} /></div>;
    },
    featured_grid: (s, fItems, allItems) => <ProductGrid key="grid" items={fItems} shopId={s.id} />,
    value_props: (s) => {
       const cfg = s.appearance_config || {};
       const wordings = cfg.wordings || {};
       const customProps = [
         wordings.val_prop_1_title && { id: '1', title: wordings.val_prop_1_title, text: wordings.val_prop_1_text || '', emoji: '✅' },
         wordings.val_prop_2_title && { id: '2', title: wordings.val_prop_2_title, text: wordings.val_prop_2_text || '', emoji: '🚚' },
         wordings.val_prop_3_title && { id: '3', title: wordings.val_prop_3_title, text: wordings.val_prop_3_text || '', emoji: '🔒' },
       ].filter(Boolean);
       return <ValueProps key="props" props={customProps} industryType={s.industry_type || ''} />;
    },
    cta: (s) => (
      <div key="cta" className="text-center py-20 px-6" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
          <p className="text-xs font-black uppercase tracking-[0.2em] mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Ready to shop?</p>
          <h2 className="text-3xl font-black mb-3" style={{ color: '#fff' }}>Explore the Full Catalogue</h2>
          <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>Browse every product, place your order instantly.</p>
          <button
              onClick={() => {
                 if (s.id) {
                    const hasConsented = localStorage.getItem('shopqr_privacy_consent');
                    if (hasConsented === 'true') {
                       createPublicSession(s.id);
                       navigate('/menu');
                    } else {
                       setPendingShopId(s.id);
                       setShowConsent(true);
                    }
                 }
              }}
              disabled={s.is_online === false}
              style={{ background: 'var(--primary-color, #6366f1)', color: 'white' }}
              className={`px-12 py-5 rounded-full font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl text-sm ${s.is_online === false ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
              {s.is_online === false ? '🔒 Shop Currently Closed' : '🛒 Enter Full Store'}
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
        title={seoConfig?.json_ld?.name ? `${seoConfig.json_ld.name} | ${shop.name}` : `${shop.name} | ${shop.tagline || 'Shop Online'}`}
        description={seoConfig?.json_ld?.description || shop.tagline || `Welcome to ${shop.name}. Browse our products and order online.`}
        jsonLd={seoConfig?.json_ld}
      />

      {/* Safe CSS Injection — sanitised before render */}
      {safeCss && <style>{safeCss}</style>}

      <main className="relative">
        {layout.map(sectionName => {
           try {
             const render = SectionRegistry[sectionName];
             return render ? render(shop, featuredItems, allItems) : null;
           } catch (err) {
             console.warn(`[PublicShopProfile] Section "${sectionName}" failed to render:`, err);
             return null;
           }
        })}
      </main>

      {/* Persistent Footer if not in layout */}
      {!layout.includes('footer') && <ShopFooter shop={shop} />}

      {/* Privacy Consent Modal — shown to web visitors before entering the store */}
      {showConsent && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white max-w-sm w-full rounded-3xl shadow-2xl p-8 text-center">
               <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
               </div>
               <h2 className="text-xl font-extrabold text-gray-800 mb-2">Privacy &amp; Tracking</h2>
               <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                  To give you a seamless shopping experience, this store may link to WhatsApp when you order. By continuing, you consent to session data collection in line with our Privacy Policy &amp; the Kenya Data Protection Act.
               </p>
               <div className="flex flex-col gap-3">
                  <button
                     onClick={() => {
                        localStorage.setItem('shopqr_privacy_consent', 'true');
                        setShowConsent(false);
                        if (pendingShopId) {
                           createPublicSession(pendingShopId);
                           navigate('/menu');
                        }
                     }}
                     className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition"
                  >
                     I Agree, Continue
                  </button>
                  <button
                     onClick={() => setShowConsent(false)}
                     className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 px-4 rounded-xl transition"
                  >
                     Decline &amp; Stay
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
