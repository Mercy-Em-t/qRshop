import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { getCurrentUser } from "../services/auth-service";

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [editingOrder, setEditingOrder] = useState(null);
  const [editTotal, setEditTotal] = useState(0);

  const navigate = useNavigate();
  const user = getCurrentUser();
  const SHOP_ID = user?.shop_id;

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchOrders();

    const channel = supabase
      .channel('kitchen-stream')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `shop_id=eq.${SHOP_ID}` 
      }, () => fetchOrders())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchOrders = async () => {
    const { data: shopData } = await supabase.from("shops").select("*").eq("id", SHOP_ID).single();
    if (shopData) setShop(shopData);

    const { data: orderData, error } = await supabase
      .from("orders")
      .select(`*, order_items (quantity, price, menu_items (name))`)
      .eq("shop_id", SHOP_ID)
      .not('status', 'eq', 'archived')
      .order("created_at", { ascending: false });

    if (!error && orderData) setOrders(orderData);
    setLoading(false);
  };

  const updateOrderStatus = async (id, status) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    fetchOrders();
  };

  const handleSaveEdit = async () => {
    if (!editingOrder) return;
    await supabase.from("orders").update({ 
       total_price: editTotal,
       status: 'pending_payment'
    }).eq("id", editingOrder.id);
    setEditingOrder(null);
    fetchOrders();
  };

  const isGastro = shop?.industry_type === 'food' || shop?.industry_type === 'restaurant';
  
  const filteredOrders = orders.filter(o => 
    activeTab === 'all' ? true : o.status === activeTab
  );

  const STATS = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'pending_payment', label: 'Req Pay' },
    { id: 'paid', label: 'Paid' },
    { id: 'preparing', label: 'Prep' },
    { id: 'ready', label: 'Ready' },
    { id: 'completed', label: 'Fin' },
  ];

  if (loading) return <div className="p-10 text-center animate-pulse font-black uppercase text-gray-400">Syncing Stream...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-10 shadow-sm">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
               <h1 className="text-xl font-black text-slate-900">
                  {isGastro ? '🍳 Kitchen Display' : '📦 Order Manager'}
               </h1>
               <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-0.5">
                  Savannah Command / {shop?.name}
               </p>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto max-w-full no-scrollbar">
               {STATS.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => setActiveTab(s.id)} 
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === s.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {s.label}
                  </button>
               ))}
            </div>
         </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredOrders.map(order => (
               <div key={order.id} className={`bg-white rounded-3xl p-6 border-2 transition-all ${order.status === 'pending' ? 'border-amber-400 shadow-lg' : 'border-slate-100 shadow-sm'}`}>
                  <div className="flex justify-between items-start mb-4">
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex gap-2">
                            <span>{order.order_type}</span>
                            {order.table_number && <span className="text-indigo-600">Table {order.table_number}</span>}
                         </p>
                         <h3 className="font-bold text-slate-900 leading-tight">{order.client_name || 'Guest User'}</h3>
                         <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">#{order.id.split('-')[0].toUpperCase()}</span>
                            <span className="text-[10px] text-slate-400 italic">
                                {order.client_phone ? 
                                   (order.client_phone.slice(0, 4) + '•••' + order.client_phone.slice(-3)) : 
                                   'Anonymous'}
                            </span>
                         </div>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                         order.status === 'paid' ? 'bg-green-100 text-green-700' : 
                         order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                         'bg-slate-100 text-slate-500'
                      }`}>{order.status.replace('_', ' ')}</span>
                  </div>

                  <div className="space-y-2 mb-6 border-y border-slate-50 py-4 max-h-40 overflow-y-auto no-scrollbar">
                     {order.order_items?.map((item, i) => (
                        <div key={i} className="flex justify-between text-xs font-semibold">
                           <span className="text-slate-600">{item.quantity}× {item.menu_items?.name}</span>
                        </div>
                     ))}
                  </div>

                  <div className="flex justify-between items-center mb-6">
                     <p className="text-[10px] font-black text-slate-400 uppercase">Total Value</p>
                     <p className="text-lg font-black text-slate-900">KSh {order.total_price}</p>
                  </div>

                  <div className="space-y-2">
                     {order.status === 'pending' && (
                        <>
                           <div className="grid grid-cols-2 gap-2">
                              <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="bg-indigo-600 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest">Accept</button>
                              <button onClick={() => updateOrderStatus(order.id, 'rejected')} className="bg-red-50 text-red-600 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest">Reject</button>
                           </div>
                           <button onClick={() => { setEditingOrder(order); setEditTotal(order.total_price); }} className="w-full border-2 border-amber-100 text-amber-700 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest">Edit & Req Pay</button>
                        </>
                     )}
                     {order.status === 'pending_payment' && (
                        <button onClick={() => updateOrderStatus(order.id, 'paid')} className="w-full bg-green-600 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest">Confirm Cash/Mpesa</button>
                     )}
                     {['paid', 'preparing'].includes(order.status) && (
                        <button onClick={() => updateOrderStatus(order.id, 'ready')} className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest">Mark Ready</button>
                     )}
                     {order.status === 'ready' && (
                        <button onClick={() => updateOrderStatus(order.id, 'completed')} className="w-full bg-emerald-600 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest">Finish / Handover</button>
                     )}
                     {order.status === 'completed' && (
                        <button onClick={() => updateOrderStatus(order.id, 'archived')} className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-center">Archive Record</button>
                     )}
                  </div>
               </div>
            ))}
         </div>
         {filteredOrders.length === 0 && <div className="py-20 text-center font-black text-slate-300 uppercase tracking-[0.2em]">Silence in the Savannah</div>}
      </main>

      {editingOrder && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-sm border border-slate-200">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ref #{editingOrder.id.split('-')[0].toUpperCase()}</p>
               <h3 className="text-xl font-black mb-8">Edit Total & Request Payment</h3>
               <div className="mb-10">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">New Order Value (KSh)</label>
                  <input 
                     type="number" 
                     value={editTotal} 
                     onChange={e => setEditTotal(e.target.value)} 
                     className="w-full text-4xl font-black border-b-4 border-slate-100 outline-none pb-4 focus:border-indigo-600" 
                  />
               </div>
               <div className="grid gap-3">
                  <button onClick={handleSaveEdit} className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black uppercase text-xs tracking-widest">Publish Revision</button>
                  <button onClick={() => setEditingOrder(null)} className="w-full bg-slate-50 text-slate-400 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest">Discard</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
