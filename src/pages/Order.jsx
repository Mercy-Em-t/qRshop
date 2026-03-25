import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getQrSession } from "../utils/qr-session";
import { useShop } from "../hooks/use-shop";
import { useCart } from "../hooks/use-cart";
import { createOrder } from "../services/order-service";
import { supabase } from "../lib/supabase";
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
import UpgradeModal from "../components/UpgradeModal";

const buildUnstructuredMessage = (shopName, table, items, identity, deliveryFee = 0) => {
   const itemList = items.map(i => `${i.quantity}x ${i.name}`).join(", ");
   const contactStr = identity?.name ? `\n\nName: ${identity.name}` : ''; 
   
   let fulfillStr = `Table ${table}`;
   if (identity?.fulfillment_type === 'delivery') {
      fulfillStr = `Delivery to ${identity.address}\n🚗 Delivery Fee: KSh ${deliveryFee}`;
   } else if (identity?.fulfillment_type === 'pickup') {
      fulfillStr = `Pickup`;
   } else if (identity?.fulfillment_type === 'digital') {
      fulfillStr = `Digital Delivery to ${identity.address}`;
   }
   
   return `Hi ${shopName}, I'd like to place an order for ${fulfillStr}.${contactStr}\n\nItems: ${itemList}\n\nPlease confirm.`;
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
      phone: localStorage.getItem('qr_customer_phone') || "",
      fulfillment_type: "dine_in",
      address: ""
  });
  
  const terms = useNomenclature(session?.shop_id);
  
  const shopPlan = shop?.plan?.toLowerCase() || 'free';
  const shopPlanAccess = {
      isFree: shopPlan === 'free',
      isBasic: ['basic', 'pro', 'business', "enterprise"].includes(shopPlan),
      isPro: ['pro', "business", "enterprise"].includes(shopPlan),
      isBusiness: ["business", "enterprise"].includes(shopPlan),
      isEnterprise: shopPlan === 'enterprise'
  };

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

  // Update default fulfillment based on shop industry type once loaded
  useEffect(() => {
     if (shop) {
        setIdentity(prev => {
           // Don't override if they already selected something valid
           if (prev.fulfillment_type === 'digital' && shop.industry_type === 'digital') return prev;
           if (['pickup', 'delivery'].includes(prev.fulfillment_type) && shop.industry_type === 'retail') return prev;
           
           if (shop.industry_type === 'digital') {
               return { ...prev, fulfillment_type: 'digital' };
           } else if (shop.industry_type === 'retail') {
               return { ...prev, fulfillment_type: shop.offers_pickup ? 'pickup' : 'delivery' };
           } else {
               // Restaurant
               return { ...prev, fulfillment_type: shop.offers_dine_in !== false ? 'dine_in' : (shop.offers_pickup ? 'pickup' : 'delivery') };
           }
        });
     }
  }, [shop]);

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

  const deliveryFee = identity.fulfillment_type === 'delivery' ? (shop?.delivery_fee || 0) : 0;
  const finalPayableTotal = Number(total) + Number(deliveryFee);

  const generateDatabaseOrder = async () => {
     if (sending) return null; // Synchronous re-entry guard
     
     // Phase 46: Duplicate Order Guard (30 sec throttle on exact cart matches)
     const orderHashData = { count: items.length, total: total, phone: identity.phone };
     const hashString = JSON.stringify(orderHashData);
     const lastHash = localStorage.getItem("qr_last_order_hash");
     const lastHashTime = localStorage.getItem("qr_last_order_time");
     
     if (lastHash === hashString && lastHashTime && (Date.now() - Number(lastHashTime) < 30000)) {
         console.warn("Duplicate order detected! Rejecting.");
         alert("You just placed this exact order! Please wait a moment before ordering again.");
         clearCart(); // Clear the double-clicked cart
         return null; 
     }

     localStorage.setItem("qr_last_order_hash", hashString);
     localStorage.setItem("qr_last_order_time", Date.now().toString());

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
        finalPayableTotal,
        discountAmount,
        activeCoupon?.code || null,
        identity.name,
        identity.phone,
        parentOrderId,
        identity.fulfillment_type,
        identity.address,
        deliveryFee
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

            // Phase 15: Save identity globally so recurring checkouts are faster
            localStorage.setItem('qr_customer_name', identity.name);
            localStorage.setItem('qr_customer_phone', identity.phone);

            // Phase 44/15: Automated WhatsApp API Dispatch for Pro/Business Teams
            if ((shopPlanAccess.isPro || shopPlanAccess.isBusiness) && isOnline && shopPhone) {
               console.log("Dispatching automated Meta WhatsApp template silently...");
               // Fire and forget so we don't delay the native React tracking redirect!
               supabase.functions.invoke('whatsapp-dispatch', {
                   body: { 
                       order_id: order.id,
                       shop_phone: shopPhone,
                       customer_name: identity.name,
                       total: finalPayableTotal,
                       summary: items.map(i => `${i.quantity}x ${i.name}`).join(", ")
                   }
               }).catch(e => console.error("Silent WA Dispatch Error:", e));
            }

            clearCart();
            navigate(`/track/${order.id}`);
         }
      } catch (err) {
         console.error("Direct Checkout Failed:", err);
         alert(err.message || "Checkout failed. Please try again.");
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
         const unstructuredMsg = buildUnstructuredMessage(shopName, session?.table, items, identity, deliveryFee);
         const link = buildWhatsAppLink(shopPhone, unstructuredMsg);
         
         // Clean up cart so returning to the browser shows an empty state
         clearCart();
         
         // Brand the transition
         setTransferringToWhatsApp(true);
         setTimeout(() => {
            setTransferringToWhatsApp(false);
            window.location.href = link;
         }, 2500);
      } else {
         clearCart();
         navigate("/menu");
      }
  };

  const handleMpesaCheckout = async () => {
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
         localStorage.setItem('qr_customer_name', identity.name);
         localStorage.setItem('qr_customer_phone', identity.phone);
         
         // Trigger STK Push via Edge Function
         console.log("Triggering M-Pesa STK Push...");
         const { data, error: pushErr } = await supabase.functions.invoke('mpesa-stk-push', {
             body: { 
                 order_id: order.id,
                 phone: identity.phone,
                 amount: finalPayableTotal,
                 shop_id: shop?.id
             }
         });

         if (pushErr) {
             console.error("STK Push invocation failed:", pushErr);
             // We gracefully fall back to just tracking the unpaid order
         }

         clearCart();
         // Navigate to tracker, passing a query param so the UI knows to show "Awaiting M-Pesa PIN"
         navigate(`/track/${order.id}?payment=mpesa_pending`);
      }
    } catch (err) {
      console.error("M-Pesa Checkout failed:", err);
      alert(err.message || "Checkout failed. Please try again.");
    } finally {
      setSending(false);
    }
  };

   const shareTextReceipt = () => {
     if (!shopPlanAccess.isBasic && isOnline) {
         setLockedFeatureFocus("Structured Order Receipts");
         return;
     }

     if (shopPhone) {
        const finalMessage = buildWhatsAppMessage(
           shopName, session?.table, items, generatedOrder?.id || "OFFLINE", total, 
           discountAmount, activeCoupon?.code, !isOnline, identity.name, identity.phone,
           identity.fulfillment_type, identity.address, deliveryFee
        );
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
          {shop?.is_online === false && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm font-semibold border border-red-100 flex items-center gap-2">
              <span>🔴</span>
              <span>This shop is currently closed. You cannot place an order right now.</span>
            </div>
          )}
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
              disabled={sending || shop?.is_online === false}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-colors flex items-center justify-center gap-2 shadow-md ${sending || shop?.is_online === false ? 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-80' : 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'}`}
            >
              {!isOnline 
                 ? "📥 Queue via WhatsApp" 
                 : !shopPlanAccess.isBasic 
                    ? `💬 Place ${terms.order} via WhatsApp` 
                    : `🛒 Place ${terms.order} (Direct Checkout)`}
            </button>
            
            <a
               href={buildWhatsAppLink(shopPhone, `Hi ${shopName}, I have a question about my order/menu.`)}
               target="_blank"
               rel="noopener noreferrer"
               className={`w-full py-4 rounded-xl font-bold text-lg border-2 transition-colors flex items-center justify-center gap-2 shadow-sm ${shop?.is_online === false ? 'border-gray-300 text-gray-400 cursor-not-allowed pointer-events-none' : 'border-green-600 bg-white text-green-700 hover:bg-green-50 z-10'}`}
            >
               💬 Inquire via Chatbot
            </a>
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

               <div className="mb-5">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Your Details</h2>
                  <p className="text-sm text-gray-500">How should the shop handle this {terms.order.toLowerCase()}?</p>
               </div>

               {/* Fulfillment Selection */}
               {shop?.industry_type !== 'digital' && (
                 <div className="mb-5 flex gap-2">
                   {(!shop?.industry_type || shop?.industry_type === 'restaurant') && shop?.offers_dine_in !== false && session?.table && (
                     <button 
                        onClick={() => setIdentity({...identity, fulfillment_type: 'dine_in'})}
                        className={`flex-1 py-2 px-1 rounded-lg text-sm font-bold border ${identity.fulfillment_type === 'dine_in' ? 'bg-green-50 border-green-600 text-green-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'} transition-all text-center`}
                     >
                       🍽️ Dine In
                     </button>
                   )}
                   {shop?.offers_pickup && (
                     <button 
                        onClick={() => setIdentity({...identity, fulfillment_type: 'pickup'})}
                        className={`flex-1 py-2 px-1 rounded-lg text-sm font-bold border ${identity.fulfillment_type === 'pickup' ? 'bg-green-50 border-green-600 text-green-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'} transition-all text-center`}
                     >
                       🛍️ Pickup
                     </button>
                   )}
                   {shop?.offers_delivery && (
                     <button 
                        onClick={() => setIdentity({...identity, fulfillment_type: 'delivery'})}
                        className={`flex-1 py-2 px-1 rounded-lg text-sm font-bold border ${identity.fulfillment_type === 'delivery' ? 'bg-green-50 border-green-600 text-green-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'} transition-all text-center`}
                     >
                       🚗 Delivery
                     </button>
                   )}
                 </div>
               )}

               {shop?.industry_type === 'digital' && (
                 <div className="mb-5 p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-center">
                    <p className="text-sm font-bold text-indigo-800">💻 Digital Delivery</p>
                    <p className="text-xs text-indigo-600">Items will be sent to your email</p>
                 </div>
               )}

               <div className="space-y-4 mb-6">
                  {identity.fulfillment_type === 'delivery' && (
                     <div className="animate-fade-in">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                        <textarea 
                           rows="2"
                           required
                           value={identity.address}
                           onChange={(e) => setIdentity({...identity, address: e.target.value})}
                           placeholder="Enter your street/apartment..."
                           className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        />
                     </div>
                  )}

                  {identity.fulfillment_type === 'digital' && (
                     <div className="animate-fade-in">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address for Delivery</label>
                        <input 
                           type="email"
                           required
                           value={identity.address}
                           onChange={(e) => setIdentity({...identity, address: e.target.value})}
                           placeholder="youremail@example.com"
                           className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                        />
                     </div>
                  )}

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
                  {shopPlanAccess.isBasic && (
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
                        {identity.phone && identity.phone.replace(/[^0-9]/g, '').length < 9 && (
                           <p className="text-xs text-red-500 mt-1.5 font-bold">Please enter a valid complete phone number.</p>
                        )}
                     </div>
                  )}
               </div>

               {shop?.mpesa_shortcode && shopPlanAccess.isBasic ? (
                 <button 
                    onClick={() => {
                       setCapturingIdentity(false);
                       handleMpesaCheckout();
                    }}
                    disabled={!identity.name || !identity.phone || identity.phone.replace(/[^0-9]/g, '').length < 9 || sending || (identity.fulfillment_type === 'delivery' && !identity.address)}
                    className="w-full bg-[#3CBC3C] text-white font-bold py-3 rounded-xl hover:bg-[#32a832] transition disabled:opacity-50 cursor-pointer shadow-md flex items-center justify-center gap-2"
                 >
                    {sending ? "Processing..." : `📲 Pay with M-Pesa (KSh ${finalPayableTotal})`}
                 </button>
               ) : (
                 <button 
                    onClick={() => {
                       setCapturingIdentity(false);
                       if (!shopPlanAccess.isBasic && isOnline) {
                          handeFreeTierCheckout();
                       } else {
                          handleDirectCheckout();
                       }
                    }}
                    disabled={
                       !identity.name || 
                       sending || 
                       (identity.fulfillment_type === 'delivery' && !identity.address) || 
                       (shopPlanAccess.isBasic && (!identity.phone || identity.phone.replace(/[^0-9]/g, '').length < 9))
                    }
                    className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition disabled:opacity-50 cursor-pointer shadow-md"
                 >
                    {sending ? "Processing..." : !shopPlanAccess.isBasic ? `💬 Place ${terms.order} via WhatsApp` : `🛒 Place ${terms.order} (Direct Checkout)`}
                 </button>
               )}
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
            isFree={shopPlanAccess.isFree}
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
