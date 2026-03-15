import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getQrSession } from "../utils/qr-session";
import { useShop } from "../hooks/use-shop";
import { useCart } from "../hooks/use-cart";
import { createOrder } from "../services/order-service";
import { logEvent } from "../services/telemetry-service";
import {
  buildWhatsAppMessage,
  buildWhatsAppLink,
} from "../utils/whatsapp-builder";
import {
  queueOrder,
  registerOnlineSync,
} from "../utils/order-queue";
import LoadingSpinner from "../components/LoadingSpinner";
import OfflineAlert from "../components/OfflineAlert";

export default function Order() {
  const session = getQrSession();
  const navigate = useNavigate();
  const { shop, loading: shopLoading } = useShop(session?.shop_id);
  const { items, total, subtotal, discountAmount, activeCoupon, clearCart } = useCart();
  const [sending, setSending] = useState(false);
  const [queued, setQueued] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Track online/offline status
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

  if (queued) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full text-center">
          <p className="text-2xl mb-2">📥</p>
          <p className="text-gray-800 font-semibold mb-2">Order Queued!</p>
          <p className="text-gray-500 text-sm mb-4">
            Your order has been saved and will be sent via WhatsApp automatically when your connection is restored.
          </p>
          <button
            onClick={() => navigate("/menu")}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors cursor-pointer"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  if (shopLoading) {
    return <LoadingSpinner message="Preparing order..." />;
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full text-center">
          <p className="text-gray-500 mb-4">Your cart is empty</p>
          <button
            onClick={() => navigate("/menu")}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors cursor-pointer"
          >
            Go to Menu
          </button>
        </div>
      </div>
    );
  }

  const shopName = shop?.name || "Shop";
  const shopPhone = import.meta.env.VITE_SHOP_PHONE || shop?.phone || "";
  const message = buildWhatsAppMessage(shopName, session?.table, items, total, activeCoupon, discountAmount);
  const whatsappLink = shopPhone
    ? buildWhatsAppLink(shopPhone, message)
    : null;

  const handleSendOrder = async () => {
    setSending(true);
    
    // Log the event explicitly before we change boundaries
    logEvent("order_started", "N/A", session?.shop_id, navigator.userAgent, {
        total_price: total,
        item_count: items.length,
        is_offline: !isOnline
    });

    try {
      if (!isOnline) {
        // Offline — queue order for later and register background sync
        queueOrder(shopName, shopPhone, session?.table, items, total);
        registerOnlineSync();
        clearCart();
        setQueued(true);
        return;
      }

      // Online — register order in database then open WhatsApp link
      await createOrder(
        session?.shop_id,
        session?.table,
        items,
        total
      );

      if (whatsappLink) {
        window.open(whatsappLink, "_blank", "noopener,noreferrer");
        clearCart();
      }
    } catch {
      // Still allow sending even if DB tracking fails
      if (whatsappLink) {
        window.open(whatsappLink, "_blank", "noopener,noreferrer");
        clearCart();
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/cart")}
            className="text-green-600 font-medium hover:text-green-700 transition-colors cursor-pointer"
          >
            ← Back to Cart
          </button>
          <h1 className="text-xl font-bold text-gray-800">Order Summary</h1>
          <div className="w-24"></div>
        </div>
      </header>

      {!isOnline && (
        <OfflineAlert message="You are offline — your order will be sent when connection is restored" />
      )}

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            {shopName}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Table {session?.table}
          </p>

          <div className="border-t border-gray-200 pt-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between py-2 text-gray-700"
              >
                <span>
                  {item.quantity} × {item.name}
                </span>
                <span className="font-medium">
                  KSh {item.price * item.quantity}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-300 mt-4 pt-4 space-y-2">
            
            {activeCoupon && (
              <>
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>KSh {subtotal}</span>
                </div>
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Discount ({activeCoupon.discountPercentage}%)</span>
                  <span>- KSh {discountAmount}</span>
                </div>
              </>
            )}

            <div className="flex justify-between pt-2 border-t border-gray-100">
              <span className="text-lg font-semibold text-gray-800">Final Total</span>
              <span className="text-xl font-bold text-green-700">
                KSh {total}
              </span>
            </div>
            
          </div>
        </div>

        {/* Show send button when online with a valid phone, or when offline to allow queuing */}
        {whatsappLink || !isOnline ? (
          <button
            onClick={handleSendOrder}
            disabled={sending}
            className="w-full mt-6 bg-green-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {sending ? (
              <>
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                Sending...
              </>
            ) : !isOnline ? (
              "📥 Queue Order for WhatsApp"
            ) : (
              "📱 Send Order via WhatsApp"
            )}
          </button>
        ) : (
          <p className="mt-6 text-center text-red-500 text-sm">
            Shop phone number not available. Please contact the shop directly.
          </p>
        )}
      </main>
    </div>
  );
}
