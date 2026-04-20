import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import LoadingSpinner from "../components/LoadingSpinner";
import { useNomenclature } from "../hooks/use-nomenclature";

export default function TrackOrder() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pin, setPin] = useState("");
  const [processingPin, setProcessingPin] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingSaved, setRatingSaved] = useState(false);
  const [confirmingReceipt, setConfirmingReceipt] = useState(false);
  
  const terms = useNomenclature(order?.shop_id);

  useEffect(() => {
    if (!supabase) {
      setError("Database connection not configured.");
      setLoading(false);
      return;
    }

    fetchOrderDetails();

    // 1. Real-time Subscription for instant propagation
    const channel = supabase
      .channel(`order-status-${orderId}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'orders',
        filter: `id=eq.${orderId}` 
      }, (payload) => {
        console.log("Order Update Received:", payload.new);
        setOrder(prev => ({ ...prev, ...payload.new }));
      })
      .subscribe();

    // 2. Poll as a fallback every 15 seconds
    const interval = setInterval(fetchOrderDetails, 15000);
    
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      // Fetch Core Order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*, shops(name, phone, whatsapp_number)")
        .eq("id", orderId)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);
      if (orderData.client_phone) setPin(orderData.client_phone);

      // Fetch Items + Join Menu Item Name
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*, menu_items(name)")
        .eq("order_id", orderId);

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      // Check for existing rating
      const { data: ratingData } = await supabase
        .from("order_ratings")
        .select("*")
        .eq("order_id", orderId)
        .single();
      
      if (ratingData) {
        setRating(ratingData.rating);
        setComment(ratingData.comment);
        setRatingSaved(true);
      }

    } catch (err) {
      console.error("Order Tracking Error:", err);
      if (!order) setError("Could not find order. It may have been deleted.");
    } finally {
      if (loading) setLoading(false);
    }
  };

  const handleConfirmReceipt = async () => {
    setConfirmingReceipt(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("orders")
        .update({ customer_confirmed_at: now })
        .eq("id", orderId);
      if (error) throw error;
      setOrder(prev => ({ ...prev, customer_confirmed_at: now }));
    } catch (err) {
      alert("Failed to confirm receipt. Please try again.");
    } finally {
      setConfirmingReceipt(false);
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) return alert("Please select a rating.");
    setIsSubmittingRating(true);
    try {
      const { error } = await supabase
        .from("order_ratings")
        .insert([{
          order_id: orderId,
          shop_id: order.shop_id,
          rating,
          comment
        }]);
      if (error) throw error;
      setRatingSaved(true);
    } catch (err) {
      alert("Failed to save rating. Thank you anyway!");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleReorder = () => {
    try {
      const cartItems = items.map(i => ({
        id: i.menu_item_id,
        name: i.menu_items?.name,
        price: i.price,
        quantity: i.quantity,
        image_url: i.menu_items?.image_url
      }));
      const sid = order.shop_id;
      localStorage.setItem(`qr_cart_${sid}`, JSON.stringify(cartItems));
      localStorage.removeItem(`qr_parent_order_${sid}`);
      localStorage.removeItem(`qr_active_coupon_${sid}`);
      
      navigate(`/cart?shop=${sid}`);
    } catch (err) {
      alert("Failed to reorder. Please add items manually.");
    }
  };

// M-Pesa submission removed entirely

  if (loading) return <LoadingSpinner message="Locating your order..." />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full text-center">
           <p className="text-4xl mb-4">🔍</p>
           <h2 className="text-xl font-bold text-gray-800 mb-2">{terms.order} Not Found</h2>
           <p className="text-gray-500 mb-6">{error}</p>
           <Link to="/menu" className="text-green-600 font-medium hover:underline">
             Return to {terms.menu}
           </Link>
        </div>
      </div>
    );
  }

  // Define dynamic status UI elements
  // Define dynamic status UI elements mapping backend states to "Pending -> Accepted -> Paid -> Fulfilled"
  const statusConfig = {
    pending: {
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: "⏳",
      title: "Pending",
      description: `Your ${terms.order.toLowerCase()} has been sent to the shop and is waiting to be reviewed.`
    },
    accepted: {
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: "🤝",
      title: "Order Accepted",
      description: `The shop has accepted your ${terms.order.toLowerCase()}! They will request payment soon.`
    },
    pending_payment: {
      color: "bg-orange-100 text-orange-800 border-orange-200",
      icon: "📋",
      title: "Awaiting Payment",
      description: `The shop is ready! Please send payment to the shop's number (${order?.shops?.phone || order?.shops?.whatsapp_number || "the counter"}) to confirm.`
    },
    stk_pushed: {
      color: "bg-green-100 text-green-800 border-green-200",
      icon: "📲",
      title: "Enter M-Pesa PIN",
      description: `Please check your phone! An M-Pesa prompt has been sent to your number. Enter your PIN to pay.`
    },
    paid: {
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: "💳",
      title: "Paid – Being Prepared",
      description: "Payment received! The shop is now preparing your items."
    },
    preparing: {
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: "👨‍🍳",
      title: "Paid – Being Prepared",
      description: "Payment received! The shop is now preparing your items."
    },
    ready: {
      color: "bg-green-100 text-green-800 border-green-200",
      icon: "✅",
      title: "Ready for Pickup!",
      description: `Your ${terms.order.toLowerCase()} is ready. Thank you!`
    },
    completed: {
      color: "bg-green-100 text-green-800 border-green-200",
      icon: "✅",
      title: "Completed",
      description: `Your ${terms.order.toLowerCase()} is completed. Thank you!`
    },
    // --- System B Extended Lifecycle ---
    confirmed: {
      color: "bg-blue-50 text-blue-800 border-blue-200",
      icon: "📋",
      title: "Order Confirmed",
      description: "System B has accepted and confirmed your order. Preparation is underway."
    },
    shipped: {
      color: "bg-purple-50 text-purple-800 border-purple-200",
      icon: "🚚",
      title: "Order Shipped",
      description: "Your order is on the way! You can track it using the ID below."
    },
    delivered: {
      color: "bg-green-50 text-green-800 border-green-200",
      icon: "🏠",
      title: "Delivered",
      description: "Your order has been successfully delivered. Enjoy!"
    },
    failed: {
      color: "bg-red-50 text-red-800 border-red-200",
      icon: "❌",
      title: "Order Issue",
      description: "There was a problem processing your order with System B. Please contact support."
    },
    requires_edit: {
      color: "bg-yellow-50 text-yellow-800 border-yellow-200",
      icon: "⚠️",
      title: "Action Required",
      description: `The shop requested an update to your ${terms.order.toLowerCase()}. Please review their message below.`
    },
    archived: {
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: "📦",
      title: "Archived / Cancelled",
      description: `Your ${terms.order.toLowerCase()} is no longer active.`
    }
  };

  const currentStatus = statusConfig[order.status] || statusConfig.pending;
  const shortId = orderId.split("-")[0].toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 pb-12 relative">
      
      {/* Fake STK Push Removed. Manual Payment Instructions Provided in Status Module */}

      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-4 text-center">
          <Link to="/menu" className="absolute left-4 text-green-600 font-medium">← {terms.menu}</Link>
          <h1 className="text-xl font-bold text-gray-800">Live Tracker</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8 space-y-6">
        
         {/* Dynamic Status Module */}
         <section className={`rounded-xl p-6 text-center border shadow-sm transition-colors duration-500 ${currentStatus.color}`}>
            <div className="text-4xl mb-3">{currentStatus.icon}</div>
            <h2 className="text-2xl font-bold mb-1">{currentStatus.title}</h2>
            <p className="text-sm opacity-90">{currentStatus.description}</p>
            
            {order.system_b_tracking_id && (
               <div className="mt-4 pt-4 border-t border-black/10">
                  <p className="text-[10px] uppercase font-black tracking-widest opacity-60">Master Order Reference (System B)</p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                     <span className="bg-white/50 px-3 py-1 rounded-md font-mono font-bold text-lg border border-black/5 shadow-inner">
                        {order.system_b_tracking_id}
                     </span>
                  </div>
               </div>
            )}

            {/* Confirm Receipt Action */}
            {order.status === 'ready' && !order.customer_confirmed_at && (
              <button 
                onClick={handleConfirmReceipt}
                disabled={confirmingReceipt}
                className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-xl shadow-xl shadow-green-100 transition-all flex items-center justify-center gap-2"
              >
                {confirmingReceipt ? '✅ Updating...' : '🤝 Confirm Receipt'}
              </button>
            )}

            {order.status === 'ready' && order.customer_confirmed_at && (
              <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-xl text-center">
                 <p className="text-green-800 font-bold text-sm">✅ Receipt Confirmed</p>
                 <p className="text-green-600/60 text-[10px] font-bold uppercase tracking-widest mt-1">Awaiting shop to finish handover...</p>
              </div>
            )}
         </section>

        {/* Payment Module */}
        {order.status === 'pending_payment' && (
           <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-6 rounded-2xl shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-xl shadow-md shadow-green-200">📲</div>
                 <div>
                    <h3 className="font-black text-gray-900 uppercase tracking-tight">M-Pesa Payment</h3>
                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Secure Daraja Checkout</p>
                 </div>
              </div>

              <div className="space-y-4">
                 <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Phone Number</label>
                    <input 
                       type="tel"
                       value={pin} // Reusing pin state for phone number to avoid new state
                       onChange={(e) => setPin(e.target.value)}
                       placeholder="e.g. 0712345678"
                       className="w-full bg-white border border-green-100 rounded-xl px-4 py-3 text-lg font-bold focus:ring-2 focus:ring-green-500 outline-none transition-all"
                    />
                 </div>

                 <button 
                    onClick={async () => {
                       if (!pin) return alert("Please enter your phone number.");
                       setProcessingPin(true);
                       try {
                          const { data, error } = await supabase.functions.invoke('mpesa-stk-push', {
                             body: { 
                                order_id: order.id, 
                                phone: pin, 
                                amount: order.total_price,
                                shop_id: order.shop_id,
                                is_b2b: false
                             }
                          });
                          if (error) throw error;
                          alert("Prompt sent! Check your phone to enter PIN.");
                       } catch (err) {
                          alert("Automatic prompt failed. Please use manual payment below.");
                       } finally {
                          setProcessingPin(false);
                       }
                    }}
                    disabled={processingPin}
                    className={`w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-xl shadow-xl shadow-green-100 transition-all flex items-center justify-center gap-2 ${processingPin ? 'opacity-50' : ''}`}
                 >
                    {processingPin ? '🚀 Triggering...' : '💸 Pay Now'}
                 </button>

                 <div className="pt-4 border-t border-green-200/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">Manual Payment Alternative</p>
                    <div className="bg-white/60 rounded-xl p-4 border border-green-100">
                       <p className="text-xs text-gray-600 mb-2">Send <b>KSh {order.total_price}</b> to:</p>
                       <div className="flex justify-between items-center bg-green-50 px-3 py-2 rounded-lg border border-green-100">
                          <span className="text-[10px] font-bold text-green-700 underline uppercase tracking-widest cursor-pointer" onClick={() => { navigator.clipboard.writeText(order?.shops?.phone || order?.shops?.whatsapp_number || ""); alert("Copied!"); }}>
                             {order?.shops?.phone || order?.shops?.whatsapp_number || "Contact Shop"}
                          </span>
                          <span className="text-[8px] font-black bg-white px-1.5 py-0.5 rounded shadow-sm text-green-600">COPY</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        )}
        
        {/* Live Digital Receipt */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
           <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 text-sm">
              <span className="text-gray-500">Receipt <span className="font-mono text-gray-800 font-bold ml-1">#{shortId}</span></span>
              <span className="text-gray-500">{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
           </div>

           <div className="space-y-3 mb-6">
              {items.map((item) => (
                 <div key={item.id} className="flex justify-between text-gray-700">
                    <div>
                       <span className="font-medium text-gray-800 mr-2">{item.quantity}x</span>
                       <span>{item.menu_items?.name || "Item"}</span>
                    </div>
                    <span className="font-medium">KSh {item.price * item.quantity}</span>
                 </div>
              ))}
              
              {order.discount_amount > 0 && (
                 <div className="flex justify-between text-orange-600 font-medium text-sm pt-2 border-t border-gray-100 mt-3">
                    <span>Discount</span>
                    <span>-KSh {order.discount_amount}</span>
                 </div>
              )}
              
              {order.delivery_fee_charged > 0 && (
                 <div className="flex justify-between text-purple-600 font-medium text-sm pt-1">
                    <span>Delivery Fee</span>
                    <span>+KSh {order.delivery_fee_charged}</span>
                 </div>
              )}
           </div>

           <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
              <span className="text-gray-500">Total Charged</span>
              <span className="text-xl font-bold text-gray-900">KSh {order.total_price}</span>
           </div>
           
           <button 
              onClick={() => window.print()}
              className="mt-6 w-full border border-gray-200 text-gray-500 py-3 rounded-xl text-xs font-bold hover:bg-gray-50 transition print:hidden"
           >
              📄 Download/Print Receipt
           </button>
        </section>

        {/* Feedback Module */}
        {order.status === 'completed' && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-in fade-in slide-in-from-bottom-4 duration-700 print:hidden">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>⭐️</span> {ratingSaved ? 'Your Feedback' : 'Rate Your Experience'}
            </h3>
            
            {ratingSaved ? (
              <div className="text-center py-4">
                <div className="flex justify-center gap-1 mb-2">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className={`text-2xl ${s <= rating ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                  ))}
                </div>
                <p className="text-gray-600 italic">"{comment || 'No comment left.'}"</p>
                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mt-4">Thank you for your feedback!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-center gap-2">
                  {[1,2,3,4,5].map(s => (
                    <button 
                      key={s} 
                      onClick={() => setRating(s)}
                      className={`text-3xl transition-transform hover:scale-110 ${s <= rating ? 'text-amber-400' : 'text-gray-200'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us what you liked (optional)..."
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-none"
                  rows={3}
                />
                <button 
                  onClick={handleSubmitRating}
                  disabled={isSubmittingRating || rating === 0}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {isSubmittingRating ? 'Saving...' : 'Submit Review'}
                </button>
              </div>
            )}
          </section>
        )}

        {/* Reorder Block */}
        {order.status === 'completed' && (
          <div className="pt-4 print:hidden">
            <button 
              onClick={handleReorder}
              className="w-full bg-gray-900 text-white font-black py-4 rounded-xl shadow-lg hover:bg-black transition flex items-center justify-center gap-2"
            >
              <span>🔄</span> One-Click Reorder
            </button>
          </div>
        )}

        {/* Action Blocks */}
        {order.status === 'requires_edit' && (
           <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-xl shadow-sm">
             <h3 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                <span>💬</span> Message from Shop
             </h3>
             <p className="text-yellow-900 bg-white p-4 rounded-lg border border-yellow-200 italic mb-4 font-medium">
                "{order.edit_reason || 'Please modify your order.'}"
             </p>
             <p className="text-yellow-700 text-sm mb-4 leading-relaxed">
                You can review your items, remove unavailable ones, and easily resubmit.
             </p>
             <div className="flex gap-3">
                 <Link to={`/edit/${order.id}`} className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-2 rounded-lg shadow-sm transition text-center text-sm">
                    ✏️ Edit Order
                 </Link>
                 <button 
                    onClick={async () => {
                       if(confirm("Are you sure you want to cancel this order permanently?")) {
                          await supabase.from('orders').update({ status: 'archived' }).eq('id', order.id);
                          window.location.reload();
                       }
                    }}
                    className="flex-1 bg-white border border-yellow-300 hover:bg-yellow-100 text-yellow-800 font-bold py-3 px-2 rounded-lg shadow-sm transition text-center text-sm"
                 >
                    ❌ Cancel Order
                 </button>
             </div>
           </div>
        )}
        
        {order.status === 'rejected' && (
           <div className="bg-red-50 border border-red-200 p-6 rounded-xl text-center shadow-sm">
             <h3 className="font-bold text-red-800 mb-2">Want to change your order?</h3>
             <p className="text-red-600 text-sm mb-4 leading-relaxed">You can review your items, remove unavailable ones, and easily resubmit without checking out from scratch.</p>
             <Link to={`/edit/${order.id}`} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-sm transition inline-block w-full">
                Review & Edit Cart
             </Link>
           </div>
        )}
        
        <p className="text-center text-xs text-gray-400 mt-8 mb-4">
           This page updates automatically.
        </p>
      </main>
    </div>
  );
}
