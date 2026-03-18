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
import { useNomenclature } from "../hooks/use-nomenclature";
import usePlanAccess from "../hooks/usePlanAccess";
import UpgradeModal from "../components/UpgradeModal";

// Restoring unstructured message based on customer clarifying text vs audio
const buildUnstructuredMessage = (shopName, table, items, identity) => {
   const itemList = items.map(i => `${i.quantity}x ${i.name}`).join(", ");
   const contactStr = identity?.name ? `\n\nName: ${identity.name}` : ''; // Exclude phone for free tier
   return `Hi ${shopName}, I'd like to place an order from Table ${table}.${contactStr}\n\nItems: ${itemList}\n\nPlease confirm.`;
};

export default function Order() {
  const session = getQrSession();
  const navigate = useNavigate();
  const { shop, loading: shopLoading } = useShop(session?.shop_id);
  const { items, total, subtotal, discountAmount, activeCoupon, applyCoupon, clearCart, parentOrderId } = useCart();
  const [sending, setSending] = useState(false);
  const [queued, setQueued] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [savedCoupon, setSavedCoupon] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [generatedOrder, setGeneratedOrder] = useState(null);
  const [lockedFeatureFocus, setLockedFeatureFocus] = useState(null);
  const [capturingIdentity, setCapturingIdentity] = useState(false);
  const [identity, setIdentity] = useState({
      name: localStorage.getItem('qr_customer_name') || "",
      phone: localStorage.getItem('qr_customer_phone') || ""
  });
  
  const terms = useNomenclature(session?.shop_id);
  const planAccess = usePlanAccess();

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
          <p className="text-gray-800 font-semibold mb-2">{terms.order} Queued!</p>
          <p className="text-gray-500 text-sm mb-4">
            Your {terms.order.toLowerCase()} has been saved and will be sent via WhatsApp automatically when your connection is restored.
          </p>
          <button
            onClick={() => navigate("/menu")}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors cursor-pointer"
          >
            Back to {terms.menu}
          </button>
        </div>
      </div>
    );
  }

  if (shopLoading) {
    return <LoadingSpinner message={`Preparing ${terms.order.toLowerCase()}...`} />;
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
            Go to {terms.menu}
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
        activeCoupon?.code || null,
        identity.name,
        identity.phone,
        parentOrderId
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

  const handeFreeTierCheckout = () => {
      setSending(true);
      // Save identity before redirecting so it's always persisted
      localStorage.setItem('qr_customer_name', identity.name);
      if (identity.phone) localStorage.setItem('qr_customer_phone', identity.phone);
      
      if (shopPhone) {
         const unstructuredMsg = buildUnstructuredMessage(shopName, session?.table, items, identity);
         const link = buildWhatsAppLink(shopPhone, unstructuredMsg);
         window.open(link, "_blank", "noopener,noreferrer");
      }
      clearCart();
      navigate("/menu");
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
         
         // Save identity for next time
         localStorage.setItem('qr_customer_name', identity.name);
         localStorage.setItem('qr_customer_phone', identity.phone);
         
         // Phase 24/26 Feature Gating: 
         // Basic tier and above get tracking. Free tier is handled separately via handleFreeTierCheckout.
         // (If an order was somehow generated here by Free, we would force them to just view tracking without WA).
         if (!planAccess.isBasic && isOnline) {
             console.log("Free tier checkout recorded. Skipping structured notification.");
             return;
         }

         // For Basic+ users (or offline queue fallbacks), we construct the message here
         if (shopPhone) {
             const finalMessage = buildWhatsAppMessage(shopName, session?.table, items, order.id, total, discountAmount, activeCoupon?.code, !isOnline, identity.name, identity.phone);
             const finalLink = buildWhatsAppLink(shopPhone, finalMessage);
             window.open(finalLink, "_blank", "noopener,noreferrer");
         }
      }
    } catch (err) {
      console.error("WhatsApp Checkout failed:", err);
      // Fallback
      if (shopPhone && (!planAccess.isFree || !isOnline)) {
        const fallbackMessage = buildWhatsAppMessage(shopName, session?.table, items, "OFFLINE", total, discountAmount, activeCoupon?.code, !isOnline, identity.name, identity.phone);
        const fallbackLink = buildWhatsAppLink(shopPhone, fallbackMessage);
        window.open(fallbackLink, "_blank", "noopener,noreferrer");
      }
      clearCart();
    } finally {
      setSending(false);
    }
  };

   const shareTextReceipt = () => {
     if (!planAccess.isBasic && isOnline) {
         setLockedFeatureFocus("Structured Order Receipts");
         return;
     }

     if (shopPhone) {
        const finalMessage = buildWhatsAppMessage(shopName, session?.table, items, generatedOrder?.id || "OFFLINE", total, discountAmount, activeCoupon?.code, !isOnline, identity.name, identity.phone);
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
          <h1 className="text-xl font-bold text-gray-800">{terms.order} Summary</h1>
          <div className="w-24"></div>
        </div>
      </header>

      {!isOnline && (
        <OfflineAlert message={`You are offline — your ${terms.order.toLowerCase()} will be sent when connection is restored`} />
      )}
      
      {lockedFeatureFocus && (
        <UpgradeModal
          featureName={lockedFeatureFocus}
          onClose={() => setLockedFeatureFocus(null)}
        />
      )}

      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            {shopName}
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            {terms.table} {session?.table}
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
              onClick={() => {
                  setCapturingIdentity(true);
              }}
              disabled={sending}
              className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
            >
              {!isOnline 
                 ? "📥 Queue via WhatsApp" 
                 : !planAccess.isBasic 
                    ? `💬 Place ${terms.order} via WhatsApp` 
                    : `💬 Place ${terms.order} (Direct Checkout)`}
            </button>
          </div>
        ) : (
          <p className="mt-6 text-center text-red-500 text-sm">
            Shop phone number not available. Please contact the shop directly.
          </p>
        )}
      </main>

      {/* Identity Capture Modal */}
      {capturingIdentity && (
         <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
               <button onClick={() => setCapturingIdentity(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
               </button>

               <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Your Details</h2>
                  <p className="text-sm text-gray-500">How should the shop contact you?</p>
               </div>

               <div className="space-y-4 mb-6">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                     <input 
                        type="text" 
                        value={identity.name}
                        onChange={(e) => setIdentity({...identity, name: e.target.value})}
                        placeholder="John Doe"
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                     />
                  </div>
                  {planAccess.isBasic && (
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                        <input 
                           type="tel" 
                           value={identity.phone}
                           onChange={(e) => setIdentity({...identity, phone: e.target.value})}
                           placeholder="+2547..."
                           className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                     </div>
                  )}
               </div>

               <button 
                  onClick={() => {
                     setCapturingIdentity(false);
                     if (!planAccess.isBasic && isOnline) {
                        handeFreeTierCheckout();
                     } else {
                        handleWhatsAppCheckout();
                     }
                  }}
                  disabled={!identity.name || sending}
                  className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition disabled:opacity-50 cursor-pointer"
               >
                  {sending ? "Processing..." : `Confirm & Place ${terms.order}`}
               </button>
            </div>
         </div>
      )}

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
            isFree={planAccess.isFree}
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
