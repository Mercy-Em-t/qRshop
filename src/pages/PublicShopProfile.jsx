import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getShop } from "../services/shop-service";
import { getMenuItems } from "../services/menu-service";
import MetaTags from "../components/MetaTags";

// Shop Homepage Components
import ShopHero from "../components/shop/ShopHero";
import CategoryScroller from "../components/shop/CategoryScroller";
import ProductGrid from "../components/shop/ProductGrid";
import ValueProps from "../components/shop/ValueProps";
import ShopFooter from "../components/shop/ShopFooter";

export default function PublicShopProfile({ directShopId }) {
  const params = useParams();
  const navigate = useNavigate();
  const shopId = directShopId || params.shopId;
  const [shop, setShop] = useState(null);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function loadShopData() {
      try {
        const [shopData, items] = await Promise.all([
          getShop(shopId),
          getMenuItems(shopId)
        ]);

        if (!shopData) {
          setError("Shop not found");
          return;
        }

        setShop(shopData);
        // Take first 4 items as featured
        setFeaturedItems(items.slice(0, 4));
      } catch (err) {
        setError("Failed to load shop profile.");
      } finally {
        setLoading(false);
      }
    }
    loadShopData();
  }, [shopId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  if (error || !shop) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4"><h1 className="text-2xl font-bold text-gray-800">Shop Not Found</h1><button onClick={() => navigate("/")} className="mt-4 text-indigo-600">Go Home</button></div>;

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
            <CategoryScroller categories={categories} />
        </div>

        <ProductGrid items={featuredItems} shopId={shopId} />
        
        <ValueProps />

        <div className="text-center py-16 px-4 bg-gray-50">
            <h2 className="text-2xl font-black mb-4">Ready to browse everything?</h2>
            <button 
                onClick={() => navigate(`/shops/${shopId}/menu`)}
                className="bg-indigo-600 text-white px-10 py-4 rounded-full font-black uppercase tracking-widest hover:bg-indigo-700 transition"
            >
                View Full Menu
            </button>
        </div>
      </main>

      <ShopFooter shop={shop} />
    </div>
  );
}
