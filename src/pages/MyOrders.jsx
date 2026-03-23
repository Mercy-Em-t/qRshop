import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { getQrSession } from "../utils/qr-session";
import LoadingSpinner from "../components/LoadingSpinner";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const historyIds = JSON.parse(localStorage.getItem('customer_history') || '[]');
        
        if (historyIds.length === 0) {
          setOrders([]);
          setLoading(false);
          return;
        }

        if (!supabase) {
           setLoading(false);
           return;
        }

        const session = getQrSession();
        let query = supabase
          .from("orders")
          .select(`
            *,
            order_items (
              quantity,
              price,
              menu_items (name)
            )
          `)
          .in('id', historyIds)
          .neq('status', 'archived')
          .neq('status', 'stk_pushed');
          
        if (session && session.shop_id) {
           query = query.eq('shop_id', session.shop_id);
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (!error && data) {
          setOrders(data);
        }
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) return <LoadingSpinner message="Retrieving your history..." />;

  const getStatusColor = (status) => {
    if (status === 'completed' || status === 'ready') return "text-green-600 bg-green-50";
    if (status === 'preparing' || status === 'paid') return "text-blue-600 bg-blue-50";
    return "text-orange-600 bg-orange-50";
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/menu" className="text-gray-500 hover:text-gray-800 transition-colors">
             ← Menu
          </Link>
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">My Orders</h1>
          <div className="w-12"></div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-8 space-y-4">
        {orders.length === 0 ? (
           <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center mt-12">
              <span className="text-4xl block mb-4">📭</span>
              <h2 className="text-lg font-bold text-gray-800 mb-2">No History Found</h2>
              <p className="text-gray-500 text-sm mb-6">You haven't placed any orders yet. Once you check out, your digital receipts will be saved here!</p>
              <Link to="/menu" className="bg-green-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-green-700 transition">
                 Return to Menu
              </Link>
           </div>
        ) : (
           orders.map((order) => {
              const shortId = order.id.split("-")[0].toUpperCase();
              return (
                 <Link 
                   key={order.id} 
                   to={`/track/${order.id}`}
                   className="block bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:border-green-200 transition-colors"
                 >
                    <div className="flex justify-between items-start mb-3 border-b border-gray-50 pb-3">
                       <div>
                          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Receipt</p>
                          <p className="font-mono text-gray-900 font-bold">#{shortId}</p>
                       </div>
                       <div className="text-right">
                          <span className={`px-2 py-1 rounded font-bold text-[10px] uppercase tracking-wider ${getStatusColor(order.status)}`}>
                             {order.status.replace("_", " ")}
                          </span>
                          <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                             {new Date(order.created_at).toLocaleDateString()}
                          </p>
                       </div>
                    </div>

                    <div className="space-y-1 mb-3">
                       {order.order_items?.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm text-gray-600">
                             <span><span className="font-medium mr-1">{item.quantity}x</span> {item.menu_items?.name || "Item"}</span>
                          </div>
                       ))}
                       {order.order_items?.length > 2 && (
                          <p className="text-xs text-gray-400 italic">+{order.order_items.length - 2} more items</p>
                       )}
                    </div>

                    <div className="pt-3 pb-1 border-t border-gray-50 flex justify-between items-center text-sm">
                       <span className="text-gray-500 font-medium">Total</span>
                       <span className="font-bold text-gray-900">KSh {order.total_price}</span>
                    </div>

                    <div className="mt-2 text-center py-2 bg-gray-50 rounded-lg text-green-700 text-xs font-bold group-hover:bg-green-50 transition-colors">
                       View Full Details →
                    </div>
                 </Link>
              );
           })
        )}
      </main>
    </div>
  );
}
