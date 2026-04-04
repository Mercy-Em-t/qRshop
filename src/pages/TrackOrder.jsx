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
  
  const terms = useNomenclature(order?.shop_id);

  useEffect(() => {
    if (!supabase) {
      setError("Database connection not configured.");
      setLoading(false);
      return;
    }

    fetchOrderDetails();

    // Poll for status updates every 10 seconds to simulate real-time
    const interval = setInterval(fetchOrderDetails, 10000);
    return () => clearInterval(interval);
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

      // Fetch Items + Join Menu Item Name
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*, menu_items(name)")
        .eq("order_id", orderId);

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

    } catch (err) {
      console.error("Order Tracking Error:", err);
      if (!order) setError("Could not find order. It may have been deleted.");
    } finally {
      if (loading) setLoading(false);
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
    pending_payment: {
      color: "bg-orange-100 text-orange-800 border-orange-200",
      icon: "📋",
      title: "Accepted – Awaiting Payment",
      description: `The shop has accepted your ${terms.order.toLowerCase()}! Please send payment to the shop's number (${order?.shops?.phone || order?.shops?.whatsapp_number || "the counter"}) to confirm.`
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
                 <p className="text-[10px] uppercase font-black tracking-widest opacity-60">System B Tracking ID</p>
                 <p className="font-mono font-bold text-lg">{order.system_b_tracking_id}</p>
              </div>
           )}
        </section>

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
        </section>

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
