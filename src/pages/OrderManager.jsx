import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase-client";

// Utilizing the persistent demo shop ID for the MVP
const SHOP_ID = "11111111-1111-1111-1111-111111111111";

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchOrders();

    // Poll every 5 seconds for new live orders to simulate realtime
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    const { data: orderData, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          quantity,
          price,
          menu_items (name)
        )
      `)
      .eq("shop_id", SHOP_ID)
      .order("created_at", { ascending: false });

    if (!error && orderData) {
      setOrders(orderData);
    }
    if (loading) setLoading(false);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    // Optimistic UI update
    setOrders((current) =>
      current.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      console.error("Failed to update status:", error);
      fetchOrders(); // Revert on failure
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending_payment":
      case "pending":
        return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold uppercase">Awaiting Action</span>;
      case "paid":
      case "preparing":
        return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold uppercase">Preparing</span>;
      case "ready":
      case "completed":
        return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold uppercase">Completed</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-bold uppercase">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="text-green-600 font-medium hover:text-green-700 transition-colors"
          >
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Live Order Feed</h1>
          <div className="w-24"></div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Search / Pull Order Bar */}
        <div className="mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
           </svg>
           <input 
             type="text"
             placeholder="Paste WhatsApp Order ID to pull receipt..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 font-medium"
           />
           {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-gray-600 font-bold bg-gray-100 px-2 py-1 rounded-md text-sm transition">
                 Clear
              </button>
           )}
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-12">Listening for incoming orders...</p>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <span className="text-4xl">📭</span>
            <p className="text-gray-500 font-medium mt-4">No orders have been received yet.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders
              .filter(o => o.id.toLowerCase().includes(searchQuery.toLowerCase()) || o.status.includes(searchQuery.toLowerCase()))
              .map((order) => {
              const shortId = order.id.split("-")[0].toUpperCase();
              
              return (
                <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100">
                    <div>
                      <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider block mb-1">Receipt</span>
                      <span className="font-mono text-gray-900 font-bold text-lg">#{shortId}</span>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(order.status)}
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="flex-grow space-y-2 mb-6">
                    {order.order_items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          <span className="font-semibold text-gray-900 mr-2">{item.quantity}x</span>
                          {item.menu_items?.name || "Item"}
                        </span>
                        <span className="font-medium text-gray-600">KSh {item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  {/* Total & Actions */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-gray-500 font-medium text-sm">Total</span>
                      <span className="text-xl font-bold text-green-700">KSh {order.total_price}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      {(order.status === "pending_payment" || order.status === "pending") ? (
                        <button
                          onClick={() => updateOrderStatus(order.id, "preparing")}
                          className="col-span-2 bg-indigo-600 text-white font-medium py-3 rounded-lg hover:bg-indigo-700 transition"
                        >
                          💸 Trigger STK Push & Accept
                        </button>
                      ) : order.status === "preparing" ? (
                        <button
                          onClick={() => updateOrderStatus(order.id, "ready")}
                          className="col-span-2 bg-green-600 text-white font-medium py-3 rounded-lg hover:bg-green-700 transition"
                        >
                          ✅ Mark Ready for Pickup
                        </button>
                      ) : (
                        <button
                          disabled
                          className="col-span-2 bg-gray-100 text-gray-400 font-medium py-3 rounded-lg cursor-not-allowed"
                        >
                          Completed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
