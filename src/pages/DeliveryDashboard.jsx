import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser } from "../services/auth-service";
import { supabase } from "../services/supabase-client";
import LoadingSpinner from "../components/LoadingSpinner";

export default function DeliveryDashboard() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [hubs, setHubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orders"); // orders, hubs, batches
  const [filter, setFilter] = useState("all");
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);

  // New Hub Form State
  const [newHub, setNewHub] = useState({ name: "", address: "" });

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    const roles = ['delivery_manager', 'system_admin'];
    if (!roles.includes(user.role) && user.plan !== 'business') {
      navigate("/dashboard/delivery");
      return;
    }
    fetchData();
  }, [user]);

  async function fetchData() {
    try {
      const [ordersRes, agentsRes, hubsRes] = await Promise.all([
        supabase.from('orders').select('*, shops(name)').neq('delivery_status', 'none').order('created_at', { ascending: false }),
        supabase.from('delivery_agents').select('*'),
        supabase.from('delivery_hubs').select('*').order('created_at', { ascending: false })
      ]);

      setOrders(ordersRes.data || []);
      setAgents(agentsRes.data || []);
      setHubs(hubsRes.data || []);
    } catch (e) {
      console.error("Fetch failed", e);
    } finally {
      setLoading(false);
    }
  }

  const handleAddHub = async (e) => {
    e.preventDefault();
    if (!newHub.name || !newHub.address) return;
    
    try {
       const { error } = await supabase.from('delivery_hubs').insert([newHub]);
       if (error) throw error;
       setNewHub({ name: "", address: "" });
       fetchData();
    } catch (e) {
       alert("Failed to add hub: " + e.message);
    }
  };

  const moveToHub = async (orderId, hubId) => {
     try {
        const { error } = await supabase
           .from('orders')
           .update({ 
               hub_id: hubId, 
               is_at_hub: true,
               hub_arrival_at: new Date().toISOString()
           })
           .eq('id', orderId);
        
        if (error) throw error;
        fetchData();
     } catch (e) {
        alert("Failed to move to hub: " + e.message);
     }
  };

  const createBatch = async () => {
     if (selectedOrders.length === 0) return;
     setIsCreatingBatch(true);
     try {
        const { data: batch, error: bError } = await supabase
           .from('delivery_batches')
           .insert([{ status: 'preparing' }])
           .select()
           .single();
        
        if (bError) throw bError;

        const { error: oError } = await supabase
           .from('orders')
           .update({ batch_id: batch.id })
           .in('id', selectedOrders);
        
        if (oError) throw oError;

        setSelectedOrders([]);
        fetchData();
        alert(`Successfully created Batch #${batch.id.split('-')[0]} with ${selectedOrders.length} orders.`);
     } catch (e) {
        alert("Batch creation failed: " + e.message);
     } finally {
        setIsCreatingBatch(false);
     }
  };

  const toggleOrderSelection = (id) => {
     setSelectedOrders(prev => 
        prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
     );
  };

  if (loading) return <LoadingSpinner message="Calculating logistics..." />;

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => {
     if (filter === 'pending') return o.delivery_status === 'pending_pickup';
     if (filter === 'transit') return ['picked_up', 'dispatched'].includes(o.delivery_status);
     if (filter === 'delivered') return o.delivery_status === 'delivered';
     return true;
  });

  const stats = {
     totalFees: orders.reduce((acc, o) => acc + (Number(o.delivery_fee_charged) || 0), 0),
     totalPayouts: orders.reduce((acc, o) => acc + (Number(o.delivery_payout_amount) || 0), 0),
     deliveredCount: orders.filter(o => o.delivery_status === 'delivered').length,
     activeRiders: agents.filter(a => a.current_status === 'available').length
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-xl">🚚</div>
              <div>
                 <h1 className="text-lg font-black text-white tracking-tight">Logistics Command</h1>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{user.role.replace('_', ' ')} OVERRIDE</p>
              </div>
           </div>
           <div className="flex gap-4">
              <nav className="hidden md:flex bg-white/5 rounded-xl p-1">
                 {['orders', 'hubs'].map(t => (
                    <button 
                       key={t}
                       onClick={() => setActiveTab(t)}
                       className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${activeTab === t ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                       {t}
                    </button>
                 ))}
              </nav>
              {selectedOrders.length > 0 && (
                 <button 
                    onClick={createBatch}
                    disabled={isCreatingBatch}
                    className="px-4 py-2 bg-green-500 text-white rounded-xl text-xs font-black shadow-lg shadow-green-500/20 hover:bg-green-600 active:scale-95 transition-all flex items-center gap-2"
                 >
                    {isCreatingBatch ? '...' : `Create Batch (${selectedOrders.length})`}
                 </button>
              )}
              <Link to="/dashboard/delivery" className="px-4 py-2 bg-white/10 text-white rounded-xl text-xs font-bold hover:bg-white/20 transition">Exit</Link>
           </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
         {activeTab === 'orders' ? (
            <>
               {/* KPI Row */}
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                  <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl border border-white/5">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Logistics Revenue</p>
                     <p className="text-2xl font-black">KSh {stats.totalFees.toLocaleString()}</p>
                     <div className="w-full bg-white/10 h-1 rounded-full mt-4 overflow-hidden">
                        <div className="bg-green-500 h-full w-[70%]"></div>
                     </div>
                  </div>
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-center">Rider Payouts</p>
                     <p className="text-2xl font-black text-slate-900 text-center">KSh {stats.totalPayouts.toLocaleString()}</p>
                     <p className="text-[10px] text-red-500 font-black mt-2 uppercase text-center">Net Liability</p>
                  </div>
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-center">Platform Net</p>
                     <p className="text-2xl font-black text-blue-600 text-center">KSh {(stats.totalFees - stats.totalPayouts).toLocaleString()}</p>
                     <p className="text-[10px] text-slate-400 font-black mt-2 uppercase text-center">Service Fee Portion</p>
                  </div>
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm transition-transform hover:scale-[1.02]">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-center">Active Fleet</p>
                     <p className="text-2xl font-black text-slate-900 text-center">{stats.activeRiders}</p>
                     <div className="flex justify-center mt-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                     </div>
                  </div>
               </div>

               {/* Orders Table Section */}
               <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                     <h2 className="text-lg font-bold text-slate-900">Live Traffic Control</h2>
                     <div className="flex bg-slate-100 p-1 rounded-xl">
                        {['all', 'pending', 'transit', 'delivered'].map((f) => (
                           <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all capitalize ${filter === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>{f}</button>
                        ))}
                     </div>
                  </div>
                  <table className="w-full text-left">
                     <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                           <th className="px-6 py-4 w-10"></th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Route</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Logistics Node</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Financials</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {filteredOrders.map(order => (
                           <tr key={order.id} className={`hover:bg-slate-50/50 transition-colors ${selectedOrders.includes(order.id) ? 'bg-green-50/50' : ''}`}>
                              <td className="px-6 py-5">
                                 <input 
                                    type="checkbox" 
                                    checked={selectedOrders.includes(order.id)}
                                    onChange={() => toggleOrderSelection(order.id)}
                                    className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                                 />
                              </td>
                              <td className="px-6 py-5">
                                 <p className="font-bold text-slate-900 text-sm">#{order.id.split('-')[0]}</p>
                                 <p className="text-[10px] text-slate-400 font-medium">Customer: {order.customer_name}</p>
                              </td>
                              <td className="px-6 py-5">
                                 <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-600">{order.shops?.name}</span>
                                    <span className="text-slate-300">→</span>
                                    <span className="text-xs font-bold text-blue-600 truncate max-w-[100px]">{order.customer_address}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-5">
                                 {order.hub_id ? (
                                    <div className="flex flex-col">
                                       <span className="text-[10px] font-black text-indigo-600 uppercase">At Node: {hubs.find(h => h.id === order.hub_id)?.name}</span>
                                       <span className="text-[8px] text-slate-400">{new Date(order.hub_arrival_at).toLocaleTimeString()}</span>
                                    </div>
                                 ) : (
                                    <select 
                                       onChange={(e) => moveToHub(order.id, e.target.value)}
                                       className="text-[10px] border border-slate-200 rounded bg-white px-2 py-1 outline-none font-bold"
                                       defaultValue=""
                                    >
                                       <option value="" disabled>Instate Node Pickup</option>
                                       {hubs.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                    </select>
                                 )}
                              </td>
                              <td className="px-6 py-5">
                                 <p className="text-xs font-black text-slate-900">KSh {order.delivery_fee_charged}</p>
                                 <p className="text-[9px] text-slate-400 font-bold">Rider Cut: KSh {order.delivery_payout_amount}</p>
                              </td>
                              <td className="px-6 py-5 text-right">
                                 <span className={`text-[9px] font-black px-2 py-1 rounded uppercase ${order.delivery_status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {order.delivery_status}
                                 </span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </>
         ) : (
            <div className="grid md:grid-cols-3 gap-8">
               {/* Hub Management Sidebar */}
               <div className="md:col-span-1 space-y-6">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                     <h2 className="text-lg font-bold text-slate-900 mb-4">Add Logistics Node</h2>
                     <form onSubmit={handleAddHub} className="space-y-4">
                        <div>
                           <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Node Name</label>
                           <input 
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500"
                              placeholder="e.g. West Nairobi Hub"
                              value={newHub.name}
                              onChange={e => setNewHub({...newHub, name: e.target.value})}
                           />
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Full Address</label>
                           <textarea 
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500 min-h-[100px]"
                              placeholder="Physical location for rider pickups"
                              value={newHub.address}
                              onChange={e => setNewHub({...newHub, address: e.target.value})}
                           />
                        </div>
                        <button className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition shadow-lg">Register Node</button>
                     </form>
                  </div>
               </div>

               {/* Hub List */}
               <div className="md:col-span-2 space-y-4">
                  <h2 className="text-lg font-bold text-slate-900 mb-4">Active Distribution Nodes</h2>
                  {hubs.map(hub => (
                     <div key={hub.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center justify-between group hover:border-indigo-500 transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">🏢</div>
                           <div>
                              <h3 className="font-bold text-slate-900">{hub.name}</h3>
                              <p className="text-xs text-slate-500">{hub.address}</p>
                           </div>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                           <span className="text-xs font-black text-green-500 uppercase">Operational</span>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}
      </main>
    </div>
  );
}
