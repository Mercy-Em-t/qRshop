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
  const [transferringToWhatsApp, setTransferringToWhatsApp] = useState(false);
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
         is_offline: !isOnline,
         campaign_id: activeCoupon?.campaignId || null
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
             // Graceful WA transition
             setTransferringToWhatsApp(true);
             setTimeout(() => {
               setTransferringToWhatsApp(false);
               window.location.href = finalLink;
             }, 1800);
         }
      }
    } catch (err) {
      console.error("WhatsApp Checkout failed:", err);
      // Fallback
      if (shopPhone && (!planAccess.isFree || !isOnline)) {
        const fallbackMessage = buildWhatsAppMessage(shopName, session?.table, items, "OFFLINE", total, discountAmount, activeCoupon?.code, !isOnline, identity.name, identity.phone);
        const fallbackLink = buildWhatsAppLink(shopPhone, fallbackMessage);
        setTransferringToWhatsApp(true);
        setTimeout(() => {
          setTransferringToWhatsApp(false);
          window.location.href = fallbackLink;
        }, 1800);
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
      {/* WhatsApp Transfer Overlay */}
      {transferringToWhatsApp && (
        <div className="fixed inset-0 bg-[#25D366] z-50 flex flex-col items-center justify-center">
          <div className="text-white text-center">
            <svg className="w-20 h-20 mx-auto mb-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <div className="flex items-center gap-3 mb-4">
              <div className="animate-spin rounded-full h-6 w-6 border-4 border-white/30 border-t-white"></div>
              <p className="text-xl font-bold">Transferring to WhatsApp...</p>
            </div>
            <p className="text-green-100 text-sm">Your order is being packaged and sent to the shop.</p>
          </div>
        </div>
      )}

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
                           onChange={(e) => {
                             let val = e.target.value.replace(/[^0-9+]/g, '');
                             setIdentity({...identity, phone: val});
                           }}
                           onBlur={(e) => {
                             // Basic KE formatting on blur
                             let val = e.target.value;
                             if (val.startsWith('0')) val = '+254' + val.substring(1);
                             else if (val.startsWith('254')) val = '+' + val;
                             else if (val.startsWith('7') || val.startsWith('1')) val = '+254' + val;
                             setIdentity({...identity, phone: val});
                           }}
                           placeholder="07..."
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
