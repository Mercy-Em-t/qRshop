import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { resolveShopIdentifier } from "../services/shop-service";
import LoadingSpinner from "../components/LoadingSpinner";
import MetaTags from "../components/MetaTags";
import ShopFooter from "../components/shop/ShopFooter";

export default function AboutShop({ directShopId }) {
  const params = useParams();
  const navigate = useNavigate();
  const shopIdentifier = directShopId || params.identifier || params.shopId;
  const [shop, setShop] = useState(null);
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
        setShop(shopData);
        
        if (shopIdentifier !== shopData.slug && !directShopId) {
          navigate(`/s/${shopData.slug}/about`, { replace: true });
        }
      } catch (err) {
        if (!shop) setError("Failed to load shop profile.");
      } finally {
        setLoading(false);
      }
    }
    loadShopData();
  }, [shopIdentifier, navigate]);

  if (loading) return <LoadingSpinner showLogo={true} message="Loading Information..." />;
  if (error || !shop) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50"><h1 className="text-2xl font-bold text-gray-800">Shop Not Found</h1><button onClick={() => navigate("/")} className="mt-4 text-indigo-600 font-bold">Go Home</button></div>;

  const rawConfig = shop.appearance_config;
  const theme = (rawConfig && rawConfig.theme && typeof rawConfig.theme === "object") ? rawConfig.theme : {};

  return (
    <div className="min-h-screen bg-white" style={{
       '--primary-color':   theme.primary_color   || '#6366f1',
       '--secondary-color': theme.secondary_color || '#10b981',
       '--font-family':     theme.font_family      || 'Outfit'
    }}>
      <MetaTags
        title={`About Us | ${shop.name}`}
        description={shop.description || shop.tagline || `Learn more about ${shop.name}.`}
      />

      <nav className="border-b border-gray-100 bg-white/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate(`/s/${shop.slug || shop.id}`)} className="font-black text-xl text-gray-900 tracking-tight">
            {shop.name}
          </button>
          <button onClick={() => navigate(`/s/${shop.slug || shop.id}`)} className="text-sm font-bold text-gray-500 hover:text-gray-900 transition">
            Back to Shop
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-20">
        <header className="mb-12">
           <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-4">About Us</h1>
           {shop.tagline && <p className="text-xl text-gray-500">{shop.tagline}</p>}
        </header>

        <section className="prose prose-lg prose-gray max-w-none mb-20">
           {shop.description ? (
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                 {shop.description}
              </div>
           ) : (
              <p className="text-gray-500 italic">This shop hasn't provided a detailed description yet.</p>
           )}
        </section>

        {shop.industry_type && (
           <div className="bg-gray-50 rounded-2xl p-8 mb-20 border border-gray-100">
              <h3 className="font-bold text-gray-900 uppercase tracking-widest text-xs mb-2">Industry / Sector</h3>
              <p className="text-gray-700 font-medium">{shop.industry_type}</p>
           </div>
        )}
      </main>

      <ShopFooter shop={shop} />
    </div>
  );
}
