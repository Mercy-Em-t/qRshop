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
import PaymentModal from "../components/PaymentModal";
import SmartReceiptModal from "../components/SmartReceiptModal";

export default function Order() {
  const session = getQrSession();
  const navigate = useNavigate();
  const { shop, loading: shopLoading } = useShop(session?.shop_id);
  const { items, total, subtotal, discountAmount, activeCoupon, applyCoupon, clearCart } = useCart();
  const [sending, setSending] = useState(false);
  const [queued, setQueued] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [savedCoupon, setSavedCoupon] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [generatedOrder, setGeneratedOrder] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("qr_saved_coupon");
      if (stored) setSavedCoupon(JSON.parse(stored));
    } catch {}
  }, []);

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
  const shopPhone = import.meta.env.VITE_SHOP_PHONE || shop?.whatsapp_number || shop?.phone || "";

  const generateDatabaseOrder = async () => {
     if (!isOnline) {
       queueOrder(shopName, shopPhone, session?.table, items, total);
       registerOnlineSync();
       clearCart();
       setQueued(true);
       return null;
     }

     logEvent("order_started", "N/A", session?.shop_id, navigator.userAgent, {
         total_price: total,
         item_count: items.length,
         is_offline: !isOnline
     });

     return await createOrder(
        session?.shop_id,
        session?.table,
        items,
        total,
        discountAmount,
        activeCoupon?.code || null
      );
  };

  const processPaymentSuccess = async ({ method, phone }) => {
      // Store phone for tracking simulation
      if (phone) localStorage.setItem("customer_phone", phone);
      setShowPayment(false);
      handleDirectCheckout();
  };

  const handleDirectCheckout = async () => {
      setSending(true);
      try {
         const order = await generateDatabaseOrder();
         if (order && !queued) {
            const history = JSON.parse(localStorage.getItem('customer_history') || '[]');
            if (!history.includes(order.id)) {
               history.push(order.id);
               localStorage.setItem('customer_history', JSON.stringify(history));
            }

            clearCart();
            navigate(`/track/${order.id}`);
         }
      } catch (err) {
         console.error("Direct Checkout Failed:", err);
      } finally {
         setSending(false);
      }
  };

  const handleWhatsAppCheckout = async () => {
    setSending(true);
    try {
      const order = await generateDatabaseOrder();

      if (order && !queued) {
         const history = JSON.parse(localStorage.getItem('customer_history') || '[]');
         if (!history.includes(order.id)) {
            history.push(order.id);
            localStorage.setItem('customer_history', JSON.stringify(history));
         }

         setGeneratedOrder(order);
      }
    } catch (err) {
      console.error("WhatsApp Checkout failed:", err);
      // Fallback
      if (shopPhone) {
        const fallbackMessage = buildWhatsAppMessage(shopName, session?.table, items, "OFFLINE", total, discountAmount, activeCoupon?.code, !isOnline);
        const fallbackLink = buildWhatsAppLink(shopPhone, fallbackMessage);
        window.open(fallbackLink, "_blank", "noopener,noreferrer");
        clearCart();
      }
    } finally {
      setSending(false);
    }
  };

  const shareTextReceipt = () => {
     if (shopPhone) {
        const finalMessage = buildWhatsAppMessage(shopName, session?.table, items, generatedOrder?.id || "OFFLINE", total, discountAmount, activeCoupon?.code, !isOnline);
        const finalLink = buildWhatsAppLink(shopPhone, finalMessage);
        window.open(finalLink, "_blank", "noopener,noreferrer");
     }
     clearCart();
     navigate(`/track/${generatedOrder?.id}`);
  };

  const shareImageReceipt = async (dataUrl) => {
     try {
       // Convert Base64 dataURL to Blob for sharing
       const blob = await (await fetch(dataUrl)).blob();
       const file = new File([blob], `receipt_${generatedOrder?.id || 'offline'}.png`, { type: blob.type });

       if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
             files: [file],
             title: 'Order Receipt',
             text: `Order from ${shopName}. Please see the attached receipt.`
          });
       } else {
          // Fallback: Download the receipt
          const link = document.createElement('a');
          link.download = file.name;
          link.href = dataUrl;
          link.click();
          alert("Image downloaded. You can now manually attach it in WhatsApp.");
       }
     } catch (err) {
       console.error("Error sharing image:", err);
     }
     
     clearCart();
     navigate(`/track/${generatedOrder?.id}`);
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
            
            {!activeCoupon && savedCoupon && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4 flex justify-between items-center animate-fade-in">
                <div>
                  <p className="font-bold text-indigo-800">{savedCoupon.description}</p>
                  <p className="text-xs text-indigo-600 mt-1">Tap to redeem your reward!</p>
                </div>
                <button 
                  onClick={() => applyCoupon(savedCoupon)} 
                  className="bg-indigo-600 px-4 py-2 rounded-lg text-white font-bold text-sm shadow-sm transition-colors hover:bg-indigo-700 cursor-pointer"
                >
                  Apply
                </button>
              </div>
            )}

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

        {/* Split Checkouts: Pure Web vs WhatsApp Hybrid */}
        {shopPhone || !isOnline ? (
          <div className="mt-8 space-y-3">
            {/* TEMPORARILY DISABLED FOR LIVE M-PESA API PENDING 
            <button
              onClick={() => setShowPayment(true)}
              disabled={sending}
              className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {sending ? (
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
              ) : (
                "💳 Secure Direct Checkout"
              )}
            </button>
            */}

            <button
              onClick={handleWhatsAppCheckout}
              disabled={sending}
              className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
            >
              {!isOnline ? "📥 Queue via WhatsApp" : "💬 Place Order via WhatsApp"}
            </button>
          </div>
        ) : (
          <p className="mt-6 text-center text-red-500 text-sm">
            Shop phone number not available. Please contact the shop directly.
          </p>
        )}
      </main>

      {showPayment && (
        <PaymentModal 
           amount={total} 
           onComplete={processPaymentSuccess}
           onCancel={() => setShowPayment(false)}
        />
      )}

      {generatedOrder && (
         <SmartReceiptModal 
            shopName={shopName}
            table={session?.table}
            items={items}
            total={total}
            discountAmount={discountAmount}
            couponCode={activeCoupon?.code}
            orderId={generatedOrder.id}
            isOffline={!isOnline}
            onShareText={shareTextReceipt}
            onShareImage={shareImageReceipt}
            onClose={() => {
               clearCart();
               navigate(`/track/${generatedOrder.id}`);
            }}
         />
      )}
    </div>
  );
}
