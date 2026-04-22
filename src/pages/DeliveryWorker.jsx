import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser } from "../services/auth-service";
import { supabase } from "../services/supabase-client";
import LoadingSpinner from "../components/LoadingSpinner";

export default function DeliveryWorker() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("available"); // available, active, history

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchOrders();

    const subscription = supabase
      .channel('delivery_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders)
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, []);

  async function fetchOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, shops(name, phone, whatsapp_number, address)')
        .neq('delivery_status', 'none')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (e) {
      console.error("Fetch orders failed", e);
    } finally {
      setLoading(false);
    }
  }

  const updateStatus = async (orderId, newStatus) => {
     try {
        const { error } = await supabase
           .from('orders')
           .update({ 
               delivery_status: newStatus,
               delivery_agent_id: user.id 
           })
           .eq('id', orderId);
        
        if (error) throw error;
        
        // Log the change
        await supabase.from('delivery_logs').insert({
            order_id: orderId,
            agent_id: user.id,
            status: newStatus
        });

        fetchOrders();
     } catch (e) {
        alert("Failed to update status: " + e.message);
     }
  };

  if (loading) return <LoadingSpinner message="Loading your route..." />;

  const available = orders.filter(o => o.delivery_status === 'pending_pickup');
  const active = orders.filter(o => o.delivery_agent_id === user.id && ['picked_up', 'dispatched'].includes(o.delivery_status));
  const history = orders.filter(o => o.delivery_agent_id === user.id && o.delivery_status === 'delivered');

  const displayOrders = activeTab === "available" ? available : activeTab === "active" ? active : history;

  const getStatusLabel = (status) => {
     const labels = {
        pending_pickup: "Ready for Pickup",
        picked_up: "Picked Up - In Transit",
        dispatched: "Out for Delivery",
        delivered: "Delivered Successfully"
     };
     return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
           <Link to="/a/delivery" className="text-slate-400">← Back</Link>
           <h1 className="font-bold text-slate-800">My Deliveries</h1>
           <button onClick={fetchOrders} className="text-blue-600 text-sm font-bold">Refresh</button>
        </div>
        <div className="max-w-lg mx-auto px-2 flex pb-2">
           <button 
              onClick={() => setActiveTab("available")}
              className={`flex-1 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'available' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}
           >
              Available ({available.length})
           </button>
           <button 
              onClick={() => setActiveTab("active")}
              className={`flex-1 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'active' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}
           >
              Active ({active.length})
           </button>
           <button 
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}
           >
              History
           </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
         {displayOrders.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
               <p className="text-4xl mb-4">📭</p>
               <h3 className="text-slate-800 font-bold mb-1">No orders here</h3>
               <p className="text-slate-400 text-sm">Check back later for new delivery requests.</p>
            </div>
         ) : (
            displayOrders.map(order => (
               <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-5">
                     <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">#{order.id.split('-')[0]}</span>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                           order.delivery_status === 'pending_pickup' ? 'bg-orange-100 text-orange-700' :
                           order.delivery_status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                           {getStatusLabel(order.delivery_status)}
                        </span>
                     </div>

                     <div className="space-y-4">
                        <div className="flex gap-4">
                           <div className="text-2xl">🏬</div>
                           <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Pickup From</p>
                              <p className="font-bold text-slate-800 leading-tight">{order.shops?.name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{order.shops?.address || "Contact shop for location"}</p>
                           </div>
                        </div>

                        <div className="flex gap-4">
                           <div className="text-2xl">📍</div>
                           <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Deliver To</p>
                              <p className="font-bold text-slate-800 leading-tight">{order.customer_name || "Customer"}</p>
                              <p className="text-xs text-blue-600 font-medium underline mt-0.5">{order.customer_address || "No address provided"}</p>
                           </div>
                        </div>
                     </div>

                     <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase">Payout Estimate</p>
                           <p className="text-lg font-black text-slate-900 leading-none">KSh {order.delivery_fee_charged}</p>
                        </div>
                        <div className="flex gap-2 text-xs">
                           <a href={`tel:${order.shops?.phone}`} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center grayscale hover:grayscale-0 transition-all">📞</a>
                           <a href={`https://wa.me/${order.customer_phone}`} className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center hover:bg-green-100 transition-all">💬</a>
                        </div>
                     </div>
                  </div>

                  {/* Contextual Actions */}
                  <div className="bg-slate-50 border-t border-slate-100 p-2">
                     {order.delivery_status === 'pending_pickup' && (
                        <button 
                           onClick={() => updateStatus(order.id, 'picked_up')}
                           className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition shadow-lg"
                        >
                           Mark as Picked Up
                        </button>
                     )}
                     {order.delivery_status === 'picked_up' && (
                        <button 
                           onClick={() => updateStatus(order.id, 'dispatched')}
                           className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-lg"
                        >
                           Out for Delivery
                        </button>
                     )}
                     {order.delivery_status === 'dispatched' && (
                        <button 
                           onClick={() => updateStatus(order.id, 'delivered')}
                           className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition shadow-lg"
                        >
                           Confirm Delivery
                        </button>
                     )}
                  </div>
               </div>
            ))
         )}
      </main>

      {/* Floating Network Indicator */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-[10px] font-bold z-50 animate-bounce">
         <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
         GPS ROUTE OPTIMIZATION ACTIVE
      </div>
    </div>
  );
}
