import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import LoadingSpinner from "../components/LoadingSpinner";

export default function TrackOrder() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pin, setPin] = useState("");
  const [processingPin, setProcessingPin] = useState(false);

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
        .select("*")
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

  const submitMockPin = async () => {
    if (pin.length < 4) return;
    setProcessingPin(true);
    
    // Simulate network delay
    await new Promise(r => setTimeout(r, 1500));
    
    // Update DB
    const { error } = await supabase
      .from("orders")
      .update({ status: "preparing" })
      .eq("id", orderId);
      
    if (!error) {
       setOrder(prev => ({...prev, status: "preparing"}));
    }
    setProcessingPin(false);
  };

  if (loading) return <LoadingSpinner message="Locating your order..." />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full text-center">
           <p className="text-4xl mb-4">🔍</p>
           <h2 className="text-xl font-bold text-gray-800 mb-2">Order Not Found</h2>
           <p className="text-gray-500 mb-6">{error}</p>
           <Link to="/menu" className="text-green-600 font-medium hover:underline">
             Return to Menu
           </Link>
        </div>
      </div>
    );
  }

  // Define dynamic status UI elements
  const statusConfig = {
    pending_payment: {
      color: "bg-orange-100 text-orange-800 border-orange-200",
      icon: "⏳",
      title: "Awaiting Payment",
      description: "Please complete the STK Push on your phone to confirm your order."
    },
    preparing: {
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: "👨‍🍳",
      title: "Preparing Order",
      description: "Payment received! The kitchen is preparing your items."
    },
    ready: {
      color: "bg-green-100 text-green-800 border-green-200",
      icon: "✅",
      title: "Ready for Pickup/Delivery!",
      description: "Your order is ready. Thank you for dining with us!"
    },
    stk_pushed: {
      color: "bg-gray-900 text-white border-gray-900",
      icon: "📱",
      title: "Check Your Phone",
      description: "M-PESA prompt sent. Please enter your PIN."
    }
  };

  const currentStatus = statusConfig[order.status] || statusConfig.pending_payment;
  const shortId = orderId.split("-")[0].toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 pb-12 relative">
      
      {/* SIMULATED SAFARICOM M-PESA POPUP (STK PUSH) */}
      {order.status === "stk_pushed" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
          <div className="bg-white max-w-sm w-full rounded-2xl shadow-2xl overflow-hidden scale-in">
            <div className="bg-[#4fb948] p-4 text-center">
              <h3 className="font-bold text-white text-lg tracking-wide">M-PESA</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-800 text-center mb-6 text-lg">
                Do you want to pay KSh {order.total_price} to QR-Shop?
              </p>
              
              <div className="mb-6">
                <label className="block text-sm text-gray-500 mb-2">Enter M-PESA PIN</label>
                <input 
                  type="password"
                  maxLength="4"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-2xl tracking-[0.5em] font-mono border-b-2 border-green-500 focus:outline-none focus:border-green-700 pb-2"
                  placeholder="****"
                />
              </div>

              <div className="flex gap-3">
                <button 
                  disabled={processingPin}
                  className="flex-1 py-3 text-gray-500 font-semibold hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={submitMockPin}
                  disabled={pin.length < 4 || processingPin}
                  className="flex-1 py-3 bg-[#4fb948] text-white font-bold rounded-lg hover:bg-[#3ea038] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingPin ? "Verifying..." : "OK"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-4 text-center">
          <Link to="/menu" className="absolute left-4 text-green-600 font-medium">← Menu</Link>
          <h1 className="text-xl font-bold text-gray-800">Live Tracker</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8 space-y-6">
        
        {/* Dynamic Status Module */}
        <section className={`rounded-xl p-6 text-center border shadow-sm transition-colors duration-500 ${currentStatus.color}`}>
           <div className="text-4xl mb-3">{currentStatus.icon}</div>
           <h2 className="text-2xl font-bold mb-1">{currentStatus.title}</h2>
           <p className="text-sm opacity-90">{currentStatus.description}</p>
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
           </div>

           <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
              <span className="text-gray-500">Total Charged</span>
              <span className="text-xl font-bold text-gray-900">KSh {order.total_price}</span>
           </div>
        </section>
        
        <p className="text-center text-xs text-gray-400 mt-8">
           This page updates automatically.
        </p>
      </main>
    </div>
  );
}
