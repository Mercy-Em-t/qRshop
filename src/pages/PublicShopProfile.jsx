import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getShop } from "../services/shop-service";
import { getMenuItemsByCategory } from "../services/menu-service";
import { useNomenclature } from "../hooks/use-nomenclature";
import MetaTags from "../components/MetaTags";

export default function PublicShopProfile({ directShopId }) {
  const params = useParams();
  const navigate = useNavigate();
  const shopId = directShopId || params.shopId;
  const [shop, setShop] = useState(null);
  const [menuCategories, setMenuCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const terms = useNomenclature(shopId);

  useEffect(() => {
    async function loadShop() {
      try {
        const shopData = await getShop(shopId);
        if (!shopData) {
          setError("Shop not found");
          return;
        }
        setShop(shopData);
        const menuData = await getMenuItemsByCategory(shopId);
        setMenuCategories(menuData || {});
      } catch (err) {
        setError("Failed to load shop profile.");
      } finally {
        setLoading(false);
      }
    }
    loadShop();
  }, [shopId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  if (error || !shop) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4"><h1 className="text-2xl font-bold text-gray-800">Shop Not Found</h1><Link to="/" className="mt-4 text-indigo-600">Go Home</Link></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <MetaTags title={`${shop.name} | Modern Savannah`} description={shop.tagline} />

      <div className="bg-indigo-600 text-white py-16 px-4 text-center relative">
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 bg-white/20 px-4 py-2 rounded-full text-sm font-bold">← Back</button>
        <div className="w-24 h-24 bg-white text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">{shop.name.charAt(0).toUpperCase()}</div>
        <h1 className="text-4xl font-extrabold mb-2">{shop.name}</h1>
        <p className="text-indigo-100">{shop.tagline || "Powered by Smart QR"}</p>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {Object.keys(menuCategories).length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm text-center">Menu coming soon.</div>
        ) : (
          <div className="space-y-8">
            {Object.keys(menuCategories).map((cat) => (
              <div key={cat}>
                <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">{cat}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  {menuCategories[cat].map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-xl flex items-start gap-4 shadow-sm border border-gray-100">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{item.name}</h4>
                        <p className="text-sm font-bold text-indigo-600">KSh {item.price}</p>
                        <p className="text-sm text-gray-500 mt-2">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="bg-white py-12 text-center border-t px-4">
        <Link to="/request-access" className="inline-block bg-gray-900 text-white px-6 py-3 rounded-full font-medium">
          Create your own Modern Savannah
        </Link>
      </div>
    </div>
  );
}
