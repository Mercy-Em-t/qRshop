import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getQrSession } from "../utils/qr-session";
import { useShop } from "../hooks/use-shop";
import { useCart } from "../hooks/use-cart";
import { createOrder, pingExternalOrderGateway } from "../services/order-service";
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
import { triggerMpesaStkPush } from "../services/payment-service";

const buildUnstructuredMessage = (shopName, table, items, identity, deliveryFee = 0, orderNumber = null) => {
   const itemList = items.map(i => `${i.quantity}x ${i.name}`).join(", ");
   const contactStr = identity?.name ? `\n\nName: ${identity.name}` : ''; 
   const orderTag = orderNumber ? `\n🏷️ Order ID: #${orderNumber}` : '';
   const trackingLink = orderNumber ? `\n🔗 Track: ${window.location.origin}/track/${orderNumber}` : '';
   
   let fulfillStr = `Table ${table}`;
   if (identity?.fulfillment_type === 'delivery') {
      fulfillStr = `Delivery to ${identity.address}\n🚗 Delivery Fee: KSh ${deliveryFee}`;
   } else if (identity?.fulfillment_type === 'pickup') {
      fulfillStr = `In-Store Pickup`;
   } else if (identity?.fulfillment_type === 'leave_with_items') {
      fulfillStr = `Takeaway (Leave with items)`;
   } else if (identity?.fulfillment_type === 'pickup_point') {
      fulfillStr = `Pickup at Depot: ${identity.address}`;
   } else if (identity?.fulfillment_type === 'digital') {
      fulfillStr = `Digital Delivery to ${identity.address}`;
   }
   
   return `Hi ${shopName}, I'd like to place an order for ${fulfillStr}.${contactStr}${orderTag}${trackingLink}\n\nItems: ${itemList}\n\nPlease confirm.`;
};

export default function Order() {
  const session = getQrSession();
  const navigate = useNavigate();
  const { shop, loading: shopLoading } = useShop(session?.shop_id);
  const { items, subtotal, discountAmount, activeCoupon, applyCoupon, clearCart, parentOrderId } = useCart();
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
      email: localStorage.getItem('qr_customer_email') || "",
      fulfillment_type: "dine_in",
      address: ""
  });
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [systemDeliveryFee, setSystemDeliveryFee] = useState(null);
  const [clientMutationId] = useState(() => {
    const saved = sessionStorage.getItem('qr_pending_mutation_id');
    if (saved) return saved;
    const newId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random();
    sessionStorage.setItem('qr_pending_mutation_id', newId);
    return newId;
  });
  const [serverAcknowledged, setServerAcknowledged] = useState(false);
   
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
        const type = shop.industry_type?.toLowerCase() || 'retail';
        setIdentity(prev => {
           if (type === 'digital') return { ...prev, fulfillment_type: 'digital' };
           if (type === 'service') return { ...prev, fulfillment_type: 'pickup' }; // "In-Person"
           if (type === 'food' || type === 'restaurant') {
               return { ...prev, fulfillment_type: session?.table ? 'dine_in' : 'pickup' };
           }
           // Default Retail
           const settings = shop.fulfillment_settings || {};
           if (settings.accepts_pickup) return { ...prev, fulfillment_type: 'pickup' };
           if (settings.accepts_leave_with_items) return { ...prev, fulfillment_type: 'leave_with_items' };
           if (settings.accepts_delivery) return { ...prev, fulfillment_type: 'delivery' };
           return { ...prev, fulfillment_type: 'pickup' };
        });

        // 🏆 NEW: Fetch Centralized Delivery Fee
        if (shop.operational_region) {
           supabase
             .from('system_logistics_config')
             .select('flat_delivery_fee')
             .eq('region_name', shop.operational_region)
             .eq('is_active', true)
             .maybeSingle()
             .then(({ data }) => {
                if (data) setSystemDeliveryFee(data.flat_delivery_fee);
             });
        }
      }
  }, [shop, session?.table]);

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

  const deliveryFee = identity.fulfillment_type === 'delivery' 
    ? (systemDeliveryFee ?? shop?.delivery_fee ?? 0) 
    : (identity.fulfillment_type === 'pickup_point' ? (shop?.fulfillment_settings?.pickup_point_fee || 0) : 0);
  const finalPayableTotal = Math.max(0, subtotal - (discountAmount || 0) + deliveryFee);
  const total = finalPayableTotal; // Back-compat for UI display

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
        activeCoupon?.code || activeCoupon?.coupon_code || null,
        identity.name,
        identity.phone,
        parentOrderId,
        identity.fulfillment_type,
        identity.address,
        deliveryFee,
        identity.email,
        activeCoupon,
        clientMutationId
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
            localStorage.setItem('qr_customer_email', identity.email);

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

            setServerAcknowledged(true);
            sessionStorage.removeItem('qr_pending_mutation_id');
            clearCart();
            
            // Show short "Success Ping" before redirect
            setTimeout(() => {
                navigate(`/track/${order.id}`);
            }, 800);
         }
      } catch (err) {
         console.error("Direct Checkout Failed:", err);
         alert(err.message || "Checkout failed. Please try again.");
      } finally {
         setSending(false);
      }
  };

  const handeFreeTierCheckout = async () => {
      setTransferringToWhatsApp(true); // Show overlay while syncing
      
      let externalOrderNumber = null;

       if (shopPhone) {
          // Phase 47: Master Order Gateway Sync (Even for Free Tier)
          // This ensures the order is tracked in the SaaS platform dashboard.
          try {
             // We await the response so we can extract the real Order ID from the SaaS platform
             const gatewayResponse = await pingExternalOrderGateway({
                clientName: identity.name || "Anonymous",
                clientPhone: identity.phone || "N/A",
                shopId: session?.shop_id,
                fulfillmentType: (identity.fulfillment_type === 'delivery') ? 'delivery' : 'pickup',
                items: items.map(i => ({ productId: i.id, qty: i.quantity, name: i.name, price: i.price, subtotal: i.price * i.quantity })),
                deliveryAddress: (identity.fulfillment_type === 'delivery') ? identity.address : "",
                notes: (session?.table) ? `Table ${session.table}` : ""
             });

             if (gatewayResponse) {
                // Support for multiple common order number field names from Ruby-Sigma
                externalOrderNumber = gatewayResponse.orderNumber || gatewayResponse.id || gatewayResponse.order_id;
             }
          } catch (e) {
             console.warn("External Gateway Sync Delayed/Offline:", e);
             // We continue anyway so the customer can still place the order via WhatsApp
          }

          const unstructuredMsg = buildUnstructuredMessage(
             shopName, 
             session?.table, 
             items, 
             identity, 
             deliveryFee,
             externalOrderNumber
          );
          const link = buildWhatsAppLink(shopPhone, unstructuredMsg);
          
          // Clean up cart so returning to the browser shows an empty state
          clearCart();

          // Wait just long enough for the UI branding to settle
          setTimeout(() => {
             setTransferringToWhatsApp(false);
             window.location.href = link;
          }, 1500);
       } else {
         clearCart();
         navigate("/menu");
      }
  };

  const handleMpesaCheckout = async () => {
    if (!identity.phone || identity.phone.length < 10) {
       alert("Please enter a valid phone number to receive the payment prompt.");
       setCapturingIdentity(true);
       return;
    }

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
         
         // Trigger STK Push
         const result = await triggerMpesaStkPush(order.id, identity.phone, finalPayableTotal, shop?.id);

         if (!result.success) {
             console.error("STK Push failed:", result.error);
             alert("M-Pesa prompt failed to reach your phone. Please check your number or try again.");
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

      {/* Resilience Ping Overlay */}
      {serverAcknowledged && (
        <div className="fixed inset-0 bg-theme-main/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center animate-fade-in">
           <div className="bg-theme-secondary/20 p-8 rounded-full mb-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-theme-accent/10 scale-0 group-hover:scale-150 transition-transform duration-1000"></div>
              <svg className="w-20 h-20 text-theme-accent animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
              </svg>
           </div>
           <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2 italic">Acknowledge Received</h2>
           <p className="text-theme-accent font-bold uppercase tracking-widest text-[10px] animate-pulse">End-to-End Encrypted Tunnel Active</p>
        </div>
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

          <div className="border-t border-gray-300 mt-4 pt-4 space-y-4">
            
            {/* Promo Code Input */}
            {!activeCoupon && (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value.toUpperCase());
                      setCouponError("");
                    }}
                    placeholder="Have a promo code?"
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm font-bold uppercase"
                  />
                  <button 
                    onClick={async () => {
                      if (!couponInput) return;
                      setApplyingCoupon(true);
                      setCouponError("");
                      try {
                        const { data, error } = await supabase
                          .from('promotions')
                          .select('*, promotion_items(menu_item_id)')
                          .eq('shop_id', session?.shop_id)
                          .eq('coupon_code', couponInput)
                          .eq('is_active', true)
                          .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
                          .single();

                        if (error || !data) throw new Error("Invalid or expired code");
                        
                        applyCoupon(data);
                        setCouponInput("");
                      } catch (err) {
                        setCouponError(err.message);
                      } finally {
                        setApplyingCoupon(false);
                      }
                    }}
                    disabled={applyingCoupon || !couponInput}
                    className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-800 transition disabled:opacity-50"
                  >
                    {applyingCoupon ? '...' : 'Apply'}
                  </button>
                </div>
                {couponError && <p className="text-[10px] text-red-500 font-bold ml-1 uppercase tracking-tight">{couponError}</p>}
              </div>
            )}
            
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
                <div className="flex justify-between text-gray-500 text-sm">
                  <span>Subtotal</span>
                  <span>KSh {subtotal}</span>
                </div>
                <div className="flex justify-between text-teal-600 font-bold text-sm animate-fade-in items-center">
                  <div className="flex items-center gap-1">
                    <span>🎁 {activeCoupon.name}</span>
                    <button onClick={() => applyCoupon(null)} className="text-[10px] bg-teal-50 px-1.5 py-0.5 rounded text-teal-400 hover:text-red-400 cursor-pointer">Remove</button>
                  </div>
                  <span>- KSh {discountAmount}</span>
                </div>
              </>
            )}

            <div className="flex justify-between pt-4 border-t border-theme-main/10 mt-4">
              <span className="text-lg font-black text-theme-main uppercase tracking-tighter">Total Payable</span>
              <span className="text-2xl font-black text-theme-secondary underline decoration-theme-accent decoration-4">
                KSh {finalPayableTotal}
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
            <button
               onClick={() => {
                   setCapturingIdentity(true);
               }}
               disabled={sending || shop?.is_online === false}
               className={`w-full py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 shadow-xl transform active:scale-95 ${sending || shop?.is_online === false ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50' : 'bg-theme-accent text-theme-main hover:bg-theme-accent-hover cursor-pointer'}`}
            >
              {!isOnline 
                 ? "📥 Queue Offline Order" 
                 : !shopPlanAccess.isBasic 
                    ? `💬 Place ${terms.order} (WhatsApp)` 
                    : `🛒 Confirm ${terms.order}`}
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
                 <div className="mb-5 grid grid-cols-2 gap-2">
                   {(!shop?.industry_type || shop?.industry_type === 'restaurant') && shop?.fulfillment_settings?.accepts_dine_in !== false && session?.table && (
                     <button 
                        onClick={() => setIdentity({...identity, fulfillment_type: 'dine_in'})}
                        className={`flex items-center justify-center gap-2 py-3 px-1 rounded-xl text-[10px] font-black uppercase tracking-tight border-2 transition-all ${identity.fulfillment_type === 'dine_in' ? 'bg-theme-main text-white border-theme-main' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                     >
                       🍽️ Dine In
                     </button>
                   )}
                   {shop?.fulfillment_settings?.accepts_pickup && (
                     <button 
                        onClick={() => setIdentity({...identity, fulfillment_type: 'pickup'})}
                        className={`flex items-center justify-center gap-2 py-3 px-1 rounded-xl text-[10px] font-black uppercase tracking-tight border-2 transition-all ${identity.fulfillment_type === 'pickup' ? 'bg-theme-main text-white border-theme-main' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                     >
                       🛍️ In-Store
                     </button>
                   )}
                   {shop?.fulfillment_settings?.accepts_leave_with_items && (
                      <button 
                         onClick={() => setIdentity({...identity, fulfillment_type: 'leave_with_items'})}
                         className={`flex items-center justify-center gap-2 py-3 px-1 rounded-xl text-[10px] font-black uppercase tracking-tight border-2 transition-all ${identity.fulfillment_type === 'leave_with_items' ? 'bg-theme-main text-white border-theme-main' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                      >
                        🔖 Takeaway
                      </button>
                   )}
                   {shop?.fulfillment_settings?.accepts_delivery && (
                      <button 
                         onClick={() => {
                           setIdentity({...identity, fulfillment_type: 'delivery'});
                           if (shop?.operational_region && !localStorage.getItem('qr_regional_ack')) {
                               alert(`Note: This shop primarily serves ${shop.operational_region}. Please ensure your delivery address is within range.`);
                               localStorage.setItem('qr_regional_ack', 'true');
                           }
                         }}
                         className={`flex items-center justify-center gap-2 py-3 px-1 rounded-xl text-[10px] font-black uppercase tracking-tight border-2 transition-all ${identity.fulfillment_type === 'delivery' ? 'bg-theme-main text-white border-theme-main' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                      >
                        🚗 Delivery
                      </button>
                   )}
                   {shop?.fulfillment_settings?.accepts_pickup_point && (
                      <button 
                         onClick={() => setIdentity({...identity, fulfillment_type: 'pickup_point'})}
                         className={`flex items-center justify-center gap-2 py-3 px-1 rounded-xl text-[10px] font-black uppercase tracking-tight border-2 transition-all ${identity.fulfillment_type === 'pickup_point' ? 'bg-theme-main text-white border-theme-main' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}
                      >
                        📦 Depot
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

                  {/* Email input for Pickup and other non-digital types */}
                  {identity.fulfillment_type !== 'digital' && (
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                           Email 
                           {identity.fulfillment_type === 'pickup' && <span className="text-gray-400 font-normal italic text-[10px] ml-1 uppercase">(Optional)</span>}
                        </label>
                        <input 
                           type="email" 
                           value={identity.email}
                           onChange={(e) => setIdentity({...identity, email: e.target.value})}
                           placeholder="you@example.com"
                           className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
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
