import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { getCurrentUser } from "../services/auth-service";
import { updateOrderStatus } from "../services/order-service";
import { useShopAgent } from "../hooks/use-shop-agent";
import { triggerMpesaStkPush } from "../services/payment-service";

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingOrder, setEditingOrder] = useState(null);
  const [editTotal, setEditTotal] = useState(0);
  const [noteOrder, setNoteOrder] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [overflowOpenId, setOverflowOpenId] = useState(null);

  const navigate = useNavigate();
  const user = getCurrentUser();
  const SHOP_ID = user?.shop_id;

  // Activate AI Shop Worker Agent
  useShopAgent(SHOP_ID);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!supabase) {
       console.error("Supabase client is not initialized.");
       setLoading(false);
       return;
    }
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
    if (!supabase) return;
    const { data: shopData } = await supabase.from("shops").select("*").eq("shop_id", SHOP_ID).single();
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
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id);
      
      if (error) {
        console.warn("Operation restricted or failed.");
        return;
      }

      fetchOrders();
    } catch (err) {
      console.warn("Order service unavailable.");
    }
  };

  const handleHandshake = async (id) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ shop_confirmed_at: new Date().toISOString() })
        .eq("id", id);
      
      if (error) throw error;
      fetchOrders();
    } catch (err) {
      alert("Failed to confirm handover.");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingOrder) return;
    try {
      const { error } = await supabase.from("orders").update({ 
         total_price: editTotal,
         status: 'pending_payment'
      }).eq("id", editingOrder.id);

      if (error) {
        console.warn("Revision rejected by server.");
        return;
      }

      // If phone exists, trigger M-Pesa immediately
      if (editingOrder.client_phone) {
         triggerMpesaStkPush(editingOrder.id, editingOrder.client_phone, editTotal, SHOP_ID);
      }

      setEditingOrder(null);
      fetchOrders();
    } catch (err) {
      console.error("Unexpected Revision Error:", err);
      alert("An unexpected error occurred while saving the revision.");
    }
  };

  const handleRequestPayment = async (order) => {
    if (!order.client_phone) {
       alert("No phone number found for this customer. Please update order first.");
       return;
    }

    try {
      // 1. Update Status
      await updateOrderStatus(order.id, 'pending_payment');

      // 2. Trigger STK Push
      const result = await triggerMpesaStkPush(order.id, order.client_phone, order.total_price, SHOP_ID);
      
      if (result.success) {
         alert(`M-Pesa prompt sent to ${order.client_phone}`);
      } else {
         alert("Failed to trigger STK push. Is the phone number valid?");
      }
    } catch (err) {
      console.error("Payment Request Error:", err);
    }
  };

  // --- CSV Export ---
  const exportCSV = () => {
    const rows = [
      ['Order ID', 'Customer', 'Phone', 'Items', 'Total (KSh)', 'Status', 'Type', 'Table', 'Date', 'Notes'],
      ...orders.map(o => [
        o.id,
        o.client_name || 'Guest',
        o.client_phone || '',
        (o.order_items || []).map(i => `${i.quantity}x ${i.menu_items?.name}`).join(' | '),
        o.total_price,
        o.status,
        o.order_type || '',
        o.table_number || '',
        new Date(o.created_at).toLocaleString(),
        o.notes || ''
      ])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${shop?.name || 'export'}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Save Note ---
  const handleSaveNote = async () => {
    if (!noteOrder) return;
    const { error } = await supabase.from('orders').update({ notes: noteText }).eq('id', noteOrder.id);
    if (!error) { setNoteOrder(null); fetchOrders(); }
  };

  const isGastro = shop?.industry_type === 'food' || shop?.industry_type === 'restaurant';
  
  const filteredOrders = orders.filter(o => {
    const matchesTab = activeTab === 'all' ? true : o.status === activeTab;
    const s = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      (o.client_name?.toLowerCase().includes(s)) ||
      (o.client_phone?.includes(s)) ||
      (o.id.toLowerCase().includes(s));
    return matchesTab && matchesSearch;
  });

  const [viewType, setViewType] = useState('grid'); // 'grid' or 'table'

  const STATS = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'pending_payment', label: 'Req Pay' },
    { id: 'paid', label: 'Paid' },
    { id: 'preparing', label: 'Prep' },
    { id: 'ready', label: 'Ready' },
    { id: 'completed', label: 'Fin' },
  ];

  if (loading) return <div className="p-10 text-center animate-pulse font-bold text-gray-400">Syncing Stream...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-40 shadow-sm">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
               <div>
                  <h1 className="text-xl font-bold text-gray-900">
                     {isGastro ? '🍳 Kitchen Display' : '📦 Order Manager'}
                  </h1>
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mt-0.5">
                     Command Center / {shop?.name}
                  </p>
               </div>
               <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button 
                    onClick={() => setViewType('grid')}
                    className={`p-2 rounded-lg transition-all ${viewType === 'grid' ? 'bg-white shadow-sm text-green-600' : 'text-slate-400'}`}
                    title="Grid View"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/></svg>
                  </button>
                  <button 
                    onClick={() => setViewType('table')}
                    className={`p-2 rounded-lg transition-all ${viewType === 'table' ? 'bg-white shadow-sm text-green-600' : 'text-slate-400'}`}
                    title="Table View (Dense)"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h16v2H4v-2z"/></svg>
                  </button>
               </div>
               <button
                  onClick={exportCSV}
                  title="Export all orders to CSV"
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-500 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
               >
                  ⬇ CSV
               </button>
               {/* Search Bar */}
               <div className="relative flex-1 md:w-64">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search Order, Name, Tel..."
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-slate-50 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-green-500 focus:border-green-500 transition sm:text-sm"
                  />
               </div>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto max-w-full no-scrollbar">
               {STATS.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => setActiveTab(s.id)} 
                    className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === s.id ? 'bg-white text-green-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    {s.label}
                  </button>
               ))}
            </div>
         </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
         {viewType === 'grid' ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredOrders.map(order => (
                 <div key={order.id} className={`bg-white rounded-2xl p-6 border transition-all ${order.status === 'pending' ? 'border-amber-400 shadow-lg' : 'border-slate-200 shadow-sm'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex gap-2">
                              <span>{order.order_type}</span>
                              {order.table_number && <span className="text-green-600">Table {order.table_number}</span>}
                           </p>
                           <h3 className="font-bold text-gray-900 leading-tight">{order.client_name || 'Guest User'}</h3>
                           <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">#{order.id.split('-')[0].toUpperCase()}</span>
                              <span className="text-[10px] text-gray-400 italic">
                                  {order.client_phone ? 
                                     (order.client_phone.slice(0, 4) + '•••' + order.client_phone.slice(-3)) : 
                                     'Anonymous'}
                              </span>
                           </div>
                        </div>
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tighter ${
                           order.status === 'paid' ? 'bg-green-100 text-green-700' : 
                           order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                           'bg-gray-100 text-gray-500'
                        }`}>{order.status.replace('_', ' ')}</span>
                    </div>

                    {/* Fulfillment Deadline */}
                    {order.fulfillment_deadline && order.status !== 'completed' && (
                       <div className="mb-4 flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target</span>
                          <div className="flex items-center gap-1.5 font-black text-rose-600">
                             <span className="text-xs">⏱️</span>
                             <span className="text-[10px]">
                                {Math.max(0, Math.floor((new Date(order.fulfillment_deadline) - new Date()) / 60000))} MINS
                             </span>
                          </div>
                       </div>
                    )}

                    {/* AI Agent Status */}
                    {order.ai_agent_status && order.ai_agent_status !== 'idle' && (
                       <div className="mb-4 flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-xl border border-indigo-100">
                          <div className={`w-1.5 h-1.5 rounded-full ${order.ai_agent_status === 'processing' ? 'bg-indigo-500 animate-pulse' : 'bg-slate-400'}`}></div>
                          <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-widest">
                             AI Worker: {order.ai_agent_status}
                          </span>
                       </div>
                    )}

                    <div className="space-y-2 mb-6 border-y border-slate-50 py-4 max-h-40 overflow-y-auto no-scrollbar">
                       {order.order_items?.map((item, i) => (
                          <div key={i} className="flex justify-between text-xs font-semibold">
                             <span className="text-gray-600">{item.quantity}× {item.menu_items?.name}</span>
                          </div>
                       ))}
                    </div>

                    <div className="flex justify-between items-center mb-6">
                       <p className="text-[10px] font-bold text-gray-400 uppercase">Total Value</p>
                       <p className="text-lg font-bold text-gray-900">KSh {order.total_price}</p>
                    </div>

                    {order.mpesa_code && (
                       <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-xl">
                          <p className="text-[9px] font-bold text-green-600 uppercase tracking-widest mb-1">M-Pesa Transaction Code</p>
                          <p className="text-sm font-black text-gray-900 tracking-widest">{order.mpesa_code}</p>
                       </div>
                    )}

                    {order.notes && (
                      <p className="text-[10px] text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-4 font-medium italic">📝 {order.notes}</p>
                    )}
                    <button onClick={() => { setNoteOrder(order); setNoteText(order.notes || ''); }} className="w-full text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-700 text-left mb-6 transition">
                      {order.notes ? '✏️ Edit Note' : '+ Add Note'}
                    </button>

                    <div className="space-y-2">
                       {order.status === 'pending' && (
                          <div className="relative">
                             {/* PRIMARY ACTION — Big Accept */}
                             <button
                                onClick={() => { updateOrderStatus(order.id, 'accepted'); setOverflowOpenId(null); }}
                                className="w-full bg-green-600 hover:bg-green-700 active:scale-95 text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                             >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                                Accept Order
                             </button>

                             {/* SECONDARY — 3-Dot Overflow */}
                             <div className="absolute top-2 right-2">
                                <button
                                   onClick={() => setOverflowOpenId(overflowOpenId === order.id ? null : order.id)}
                                   className="p-1.5 rounded-lg hover:bg-white/50 text-green-100 transition"
                                   title="More options"
                                >
                                   <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
                                </button>

                                {overflowOpenId === order.id && (
                                   <div className="absolute right-0 top-8 bg-white rounded-2xl border border-slate-100 shadow-xl z-20 w-48 overflow-hidden">
                                      <button
                                         onClick={() => { setEditingOrder(order); setEditTotal(order.total_price); setOverflowOpenId(null); }}
                                         className="w-full text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-amber-700 hover:bg-amber-50 flex items-center gap-2 transition"
                                      >
                                         <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                                         Edit & Request Pay
                                      </button>
                                      <div className="border-t border-slate-50"/>
                                      <button
                                         onClick={() => { if (window.confirm('Reject this order?')) { updateOrderStatus(order.id, 'rejected'); setOverflowOpenId(null); } }}
                                         className="w-full text-left px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-50 flex items-center gap-2 transition"
                                      >
                                         <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                                         Reject Order
                                      </button>
                                   </div>
                                )}
                             </div>
                          </div>
                       )}
                       {order.status === 'pending_payment' && (
                          <button onClick={() => updateOrderStatus(order.id, 'paid')} className="w-full bg-green-600 text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-green-100">✅ Confirm Cash / MPesa</button>
                       )}
                       
                       {['accepted', 'preparing'].includes(order.status) && (
                          <button 
                             onClick={() => handleRequestPayment(order)} 
                             className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-amber-100 flex items-center justify-center gap-2 mb-2"
                          >
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                             Request Payment
                          </button>
                       )}

                       {order.status === 'pending_payment' && (
                          <button 
                             onClick={() => triggerMpesaStkPush(order.id, order.client_phone, order.total_price, SHOP_ID)} 
                             className="w-full bg-slate-800 hover:bg-black text-white py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 mb-2"
                          >
                             🔄 Resend STK Push
                          </button>
                       )}

                       {['paid', 'accepted', 'preparing'].includes(order.status) && (
                          <button onClick={() => updateOrderStatus(order.id, 'ready')} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition">📦 Mark Ready</button>
                       )}
                       {order.status === 'ready' && (
                          <div className="space-y-2">
                             {!order.shop_confirmed_at ? (
                                <button 
                                  onClick={() => handleHandshake(order.id)} 
                                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition"
                                >
                                   🤝 Finish / Handover
                                </button>
                             ) : (
                                <div className="w-full bg-emerald-50 text-emerald-700 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border border-emerald-100 italic">
                                   ⌛ Waiting for Customer...
                                </div>
                             )}
                          </div>
                       )}
                       {order.status === 'completed' && (
                          <button onClick={() => updateOrderStatus(order.id, 'archived')} className="w-full bg-gray-900 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest">Archive Record</button>
                       )}
                    </div>
                 </div>
              ))}
           </div>
         ) : (
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-slate-50 border-b border-slate-200">
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID / Customer</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Items</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {filteredOrders.map(order => (
                     <tr key={order.id} className={`hover:bg-slate-50/50 transition-colors ${order.status === 'pending' ? 'bg-amber-50/10' : ''}`}>
                       <td className="px-6 py-4">
                         <div className="flex flex-col">
                           <span className="text-sm font-bold text-gray-900">{order.client_name || 'Guest'}</span>
                           <span className="text-[10px] text-gray-400 font-mono">#{order.id.split('-')[0].toUpperCase()}</span>
                         </div>
                       </td>
                       <td className="px-6 py-4">
                         <span className="text-[10px] font-bold text-slate-500 uppercase">{order.order_type} {order.table_number ? `(T${order.table_number})` : ''}</span>
                       </td>
                       <td className="px-6 py-4">
                         <p className="text-[11px] text-slate-600 line-clamp-1">
                           {order.order_items?.map(i => `${i.quantity}x ${i.menu_items?.name}`).join(', ')}
                         </p>
                       </td>
                       <td className="px-6 py-4">
                         <span className="text-sm font-black text-gray-900">KSh {order.total_price}</span>
                       </td>
                       <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight ${
                             order.status === 'paid' ? 'bg-green-100 text-green-700' : 
                             order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                             'bg-slate-100 text-slate-500'
                          }`}>{order.status.replace('_', ' ')}</span>
                       </td>
                       <td className="px-6 py-4 text-right">
                         <div className="flex justify-end gap-2 text-[10px] font-black uppercase">
                            {order.status === 'pending' && (
                               <button onClick={() => updateOrderStatus(order.id, 'accepted')} className="text-green-600 hover:underline">Accept</button>
                            )}
                            {['accepted', 'preparing'].includes(order.status) && (
                               <button onClick={() => updateOrderStatus(order.id, 'pending_payment')} className="text-amber-600 hover:underline">Bill</button>
                            )}
                            {['paid', 'accepted', 'preparing'].includes(order.status) && (
                               <button onClick={() => updateOrderStatus(order.id, 'ready')} className="text-blue-600 hover:underline">Ready</button>
                            )}
                             {order.status === 'ready' && (
                                <button 
                                  onClick={() => handleHandshake(order.id)} 
                                  className={`text-emerald-600 hover:underline ${order.shop_confirmed_at ? 'opacity-50 pointer-events-none' : ''}`}
                                >
                                   {order.shop_confirmed_at ? '⌛ Wait' : 'Finish'}
                                </button>
                             )}
                            <button 
                              onClick={() => { setNoteOrder(order); setNoteText(order.notes || ''); }} 
                              className="text-slate-400 hover:text-slate-600"
                            >
                               {order.notes ? '📝' : '➕'}
                            </button>
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
         )}
         {filteredOrders.length === 0 && (
            <div className="py-20 text-center">
               <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No orders matching the current filter/search.</p>
            </div>
         )}
      </main>

      {/* Notes Modal */}
      {noteOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm border border-slate-200">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Ref #{noteOrder.id.split('-')[0].toUpperCase()}</p>
            <h3 className="text-lg font-bold mb-6 text-gray-900">Order Note</h3>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              rows={4}
              placeholder="Add a note for this order (e.g. special instructions, delivery info)..."
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button onClick={handleSaveNote} className="bg-green-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Save Note</button>
              <button onClick={() => setNoteOrder(null)} className="bg-gray-50 text-gray-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {editingOrder && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl p-10 w-full max-w-sm border border-slate-200">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Ref #{editingOrder.id.split('-')[0].toUpperCase()}</p>
               <h3 className="text-xl font-bold mb-8 text-gray-900">Edit Total & Request Payment</h3>
               <div className="mb-10">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 block">New Order Value (KSh)</label>
                  <input 
                     type="number" 
                     value={editTotal} 
                     onChange={e => setEditTotal(e.target.value)} 
                     className="w-full text-4xl font-black border-b-2 border-slate-100 outline-none pb-4 focus:border-green-600" 
                  />
               </div>
               <div className="grid gap-3">
                  <button onClick={handleSaveEdit} className="w-full bg-green-600 text-white py-5 rounded-2xl font-bold uppercase text-xs tracking-widest">Publish Revision</button>
                  <button onClick={() => setEditingOrder(null)} className="w-full bg-gray-50 text-gray-400 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest">Discard</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
