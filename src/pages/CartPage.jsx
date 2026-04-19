import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../hooks/use-cart";
import { getQrSession } from "../utils/qr-session";
import { useShop } from "../hooks/use-shop";
import CartComponent from "../components/Cart";
import OfflineAlert from "../components/OfflineAlert";

export default function CartPage() {
  const navigate = useNavigate();
  const session = getQrSession();
  const { shop } = useShop(session?.shop_id);
  const { items, addItem, removeItem, total } = useCart();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
text-theme-secondary font-black hover:text-theme-accent transition-colors cursor-pointer uppercase tracking-tighter text-xs          <h1 className="text-xl font-bold text-gray-800">Your Cart</h1>
          <div className="w-24"></div>
        </div>
      </header>

      {!isOnline && (
        <OfflineAlert message="You are offline — your order can still be queued for WhatsApp" />
      )}

      <main className="max-w-lg mx-auto px-4 py-6">
        <CartComponent
          items={items}
          onAdd={addItem}
          onRemove={removeItem}
          total={total}
        />

        {items.length > 0 && (
          <div className="mt-6 space-y-3">
            {shop?.is_online === false && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm font-semibold border border-red-100 text-center">
                🔴 Shop is currently closed.
              </div>
            )}
            <button
              onClick={() => navigate("/order")}
              disabled={shop?.is_online === false}
              className={`w-full py-4 rounded-xl font-black text-lg transition-all shadow-xl transform active:scale-95 flex items-center justify-center gap-2 ${shop?.is_online === false ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50' : 'bg-theme-accent text-theme-main hover:bg-theme-accent-hover cursor-pointer'}`}
            >
              Confirm Order — KSh {total}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
