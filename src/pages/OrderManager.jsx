import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { getCurrentUser } from "../services/auth-service";

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const navigate = useNavigate();

  const user = getCurrentUser();
  const SHOP_ID = user?.shop_id;

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrders();

    // 🏆 PRODUCTION UPGRADE: REALTIME KITCHEN STREAM (Event-Driven)
    const channel = supabase
      .channel('kitchen-stream')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `shop_id=eq.${SHOP_ID}` 
      }, () => fetchOrders())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    // 1. Fetch Shop Metadata
    const { data: shopData } = await supabase
      .from("shops")
      .select("id, name, industry_type, payment_mode")
      .eq("id", SHOP_ID)
      .single();
    
    if (shopData) setShop(shopData);

    // 2. Fetch Orders
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
      setOrders(orderData.map(o => ({ ...o, shop_industry: shopData?.industry_type })));
    }
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (!error) fetchOrders();
  };

  const isGastro = shop?.industry_type === 'food' || shop?.industry_type === 'restaurant';

  const filteredOrders = orders.filter(o => {
      if (activeTab === 'all') return true;
      if (activeTab === 'local') return o.order_type === 'dine_in' || o.order_type === 'instore';
      if (activeTab === 'outbound') return o.order_type === 'delivery' || o.order_type === 'takeaway';
      return o.status === activeTab;
  });

  if (loading) return <div className="p-10 text-center animate-pulse">Loading {isGastro ? 'Kitchen' : 'Order'} Stream...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-10">
         <div className="max-w-6xl mx-auto flex justify-between items-center">
            <div>
               <h1 className="text-xl font-black text-slate-900">
                  {isGastro ? '🍳 Kitchen Display' : '📦 Order Manager'}
               </h1>
               <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-0.5">
                  {shop?.industry_type} MODE
               </p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
               <button onClick={() => setActiveTab('all')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>All</button>
               <button onClick={() => setActiveTab('local')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'local' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                  {isGastro ? 'Dining' : 'In-Store'}
               </button>
               <button onClick={() => setActiveTab('outbound')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'outbound' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
                  {isGastro ? 'Takeaway' : 'Delivery'}
               </button>
            </div>
         </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map(order => (
               <div key={order.id} className={`bg-white rounded-3xl p-6 border-2 transition-all ${order.status === 'pending' ? 'border-amber-400 animate-pulse' : 'border-slate-100 shadow-sm'}`}>
                  <div className="flex justify-between items-start mb-4">
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                            {order.order_type === 'dine_in' ? `Table ${order.table_number || '??'}` : order.order_type}
                         </p>
                         <h3 className="font-bold text-slate-900">{order.client_name || 'Guest'}</h3>
                         <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold text-slate-500">#{order.id.split('-')[0].toUpperCase()}</span>
                            <span className="text-[10px] text-slate-400 italic">
                                {order.client_phone ? 
                                   (order.client_phone.slice(0, 4) + '•••' + order.client_phone.slice(-3)) : 
                                   'No Phone'}
                            </span>
                         </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                         order.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                      }`}>{order.status}</span>
                  </div>

                  <div className="space-y-2 mb-6 border-y border-slate-50 py-4">
                     {order.order_items?.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm font-medium">
                           <span className="text-slate-600">{item.quantity}× {item.menu_items?.name}</span>
                        </div>
                     ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                     <button 
                        onClick={() => updateStatus(order.id, 'paid')}
                        className="bg-green-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-green-700 transition"
                     >
                        Mark Paid
                     </button>
                     <button 
                        onClick={() => updateStatus(order.id, 'completed')}
                        className="bg-slate-900 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition"
                     >
                        Finish Order
                     </button>
                  </div>
               </div>
            ))}
         </div>
      </main>
    </div>
  );
}
