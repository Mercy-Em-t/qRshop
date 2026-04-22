import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { resolveShopIdentifier } from "../services/shop-service";
import { getMenuItems } from "../services/menu-service";
import { getCurrentUser } from "../services/auth-service";
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


        if (!shopData) {
          setError("Shop not found");
          return;
        }

        // Legacy Feature Gate: Savannah Atelier Exclusive Access (REMOVED to restore public customer flow)
        /* 
        if (shopData.subdomain?.toLowerCase() === 'atelier' || shopData.name.toLowerCase().includes('atelier')) {
           const user = getCurrentUser();
           if (!user) {
              sessionStorage.setItem('return_to', window.location.pathname);
              navigate('/login?exclusive=true');
              return;
           }
        }
        */

        setShop(shopData);
        
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

  const shopId = shop?.id;

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-secondary"></div></div>;
  if (error || !shop) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-950 p-4"><h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Shop Not Found</h1><button onClick={() => navigate("/")} className="mt-4 text-theme-secondary font-bold">Go Home</button></div>;

  // Extract unique categories for the scroller
  const categories = Array.from(new Set(featuredItems.map(i => i.category))).map(cat => ({
    id: cat,
    name: cat,
    emoji: "📦" // Default emoji, can be mapped later
  }));

  return (
    <div className="min-h-screen bg-white">
      <MetaTags 
        title={`${shop.name} | Modern Savannah`} 
        description={shop.tagline || "Shop our exclusive collection online."} 
      />

      <main>
        <ShopHero shop={shop} />
        
        <div style={{ padding: '20px 0' }}>
            <CategoryScroller categories={categories} shopId={shopId} />
        </div>

        <ProductGrid items={featuredItems} shopId={shopId} />
        
        <ValueProps />

        <div className="text-center py-16 px-4 bg-slate-50 dark:bg-slate-950">
            <h2 className="text-2xl font-black mb-4 dark:text-white">Ready to browse everything?</h2>
            <button 
                onClick={() => {
                   if (shopId) {
                      createPublicSession(shopId);
                      navigate(`/menu`);
                   }
                }}
                className="bg-theme-secondary text-white px-10 py-4 rounded-full font-black uppercase tracking-widest hover:bg-theme-secondary/90 transition shadow-xl"
            >
                View Full Menu
            </button>
        </div>
      </main>

      <ShopFooter shop={shop} />
    </div>
  );
}
