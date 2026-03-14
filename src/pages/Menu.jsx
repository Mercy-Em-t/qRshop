import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getQrSession } from "../utils/qr-session";
import { getMenuItemsByCategory, getUpsellItems } from "../services/menu-service";
import { trackUpsell } from "../services/analytics-service";
import { getCachedMenu, cacheMenu } from "../utils/menu-cache";
import { useShop } from "../hooks/use-shop";
import { useCart } from "../hooks/use-cart";
import MenuItem from "../components/MenuItem";
import UpsellModal from "../components/UpsellModal";

export default function Menu() {
  const session = getQrSession();
  const navigate = useNavigate();
  const { shop, loading: shopLoading } = useShop(session?.shop_id);
  const { addItem, itemCount } = useCart();
  const [categories, setCategories] = useState({});
  const [menuLoading, setMenuLoading] = useState(true);
  const [upsellItems, setUpsellItems] = useState([]);
  const [lastAddedItemId, setLastAddedItemId] = useState(null);
  const [showUpsell, setShowUpsell] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (!session) return;

    async function fetchMenu() {
      setMenuLoading(true);
      try {
        const data = await getMenuItemsByCategory(session.shop_id);
        if (data && Object.keys(data).length > 0) {
          setCategories(data);
          cacheMenu(session.shop_id, data);
          setIsOffline(false);
        } else {
          // Try cached data
          const cached = getCachedMenu(session.shop_id);
          if (cached) {
            setCategories(cached);
            setIsOffline(true);
          }
        }
      } catch {
        // Network error — try cache
        const cached = getCachedMenu(session.shop_id);
        if (cached) {
          setCategories(cached);
          setIsOffline(true);
        }
      } finally {
        setMenuLoading(false);
      }
    }

    fetchMenu();
  }, [session]);

  const handleAddItem = async (item) => {
    addItem(item);
    setLastAddedItemId(item.id);

    try {
      const upsells = await getUpsellItems(item.id);
      if (upsells.length > 0) {
        const upsellMenuItems = upsells
          .map((u) => u.menu_items)
          .filter(Boolean);
        if (upsellMenuItems.length > 0) {
          setUpsellItems(upsellMenuItems);
          setShowUpsell(true);
        }
      }
    } catch {
      // Silently ignore upsell errors
    }
  };

  const handleUpsellAccept = (item) => {
    addItem(item);
    // Track upsell conversion
    if (lastAddedItemId) {
      trackUpsell(lastAddedItemId, item.id, true);
    }
    setShowUpsell(false);
    setUpsellItems([]);
    setLastAddedItemId(null);
  };

  const handleUpsellDecline = () => {
    // Track upsell decline
    if (lastAddedItemId && upsellItems.length > 0) {
      for (const uItem of upsellItems) {
        trackUpsell(lastAddedItemId, uItem.id, false);
      }
    }
    setShowUpsell(false);
    setUpsellItems([]);
    setLastAddedItemId(null);
  };

  const isLoading = shopLoading || menuLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  const categoryNames = Object.keys(categories);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {shop?.name || "Menu"}
            </h1>
            <p className="text-sm text-gray-500">Table {session?.table}</p>
          </div>
          <button
            onClick={() => navigate("/cart")}
            className="relative bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors cursor-pointer"
          >
            Cart
            {itemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {isOffline && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <p className="text-sm text-yellow-700 text-center">
            📡 Showing cached menu — you appear to be offline
          </p>
        </div>
      )}

      <main className="max-w-lg mx-auto px-4 py-6">
        {categoryNames.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No menu items available</p>
          </div>
        ) : (
          categoryNames.map((category) => (
            <div key={category} className="mb-8">
              <h2 className="text-lg font-semibold text-gray-700 mb-3 border-b border-gray-200 pb-2">
                {category}
              </h2>
              <div className="grid gap-3">
                {categories[category].map((item) => (
                  <MenuItem key={item.id} item={item} onAdd={handleAddItem} />
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      {showUpsell && (
        <UpsellModal
          upsellItems={upsellItems}
          onAccept={handleUpsellAccept}
          onDecline={handleUpsellDecline}
        />
      )}
    </div>
  );
}
