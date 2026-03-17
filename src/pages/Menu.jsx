import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useNomenclature } from "../hooks/use-nomenclature";

export default function Menu() {
  const session = getQrSession();
  const navigate = useNavigate();
  const { shop, loading: shopLoading } = useShop(session?.shop_id);
  const { addItem, itemCount } = useCart();
  const { categories, loading: menuLoading, isOffline } = useOfflineMenu();
  const [upsellItems, setUpsellItems] = useState([]);
  const [lastAddedItemId, setLastAddedItemId] = useState(null);
  const [showUpsell, setShowUpsell] = useState(false);
  
  const terms = useNomenclature(session?.shop_id);

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
    return <LoadingSpinner message="Loading menu..." />;
  }

  const categoryNames = Object.keys(categories);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {shop?.name || terms.menu}
            </h1>
            <p className="text-sm text-gray-500">{terms.table} {session?.table}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/history")}
              className="text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors"
            >
              My Orders
            </button>
            <button
              onClick={() => navigate("/cart")}
              className="relative bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors cursor-pointer shadow-sm"
            >
              Cart
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center shadow-sm border border-white">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {isOffline && (
        <OfflineAlert message={`Showing cached ${terms.menu.toLowerCase()} — you appear to be offline`} />
      )}

      <main className="max-w-lg mx-auto px-4 py-6">
        {categoryNames.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No {terms.menu.toLowerCase()} items available</p>
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

      <CouponWidget />
    </div>
  );
}
