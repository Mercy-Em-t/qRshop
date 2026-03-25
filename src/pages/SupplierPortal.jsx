import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { getCurrentUser } from "../services/auth-service";

export default function SupplierPortal() {
  const [supplier, setSupplier] = useState(null);
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingItem, setIsCreatingItem] = useState(false);
  const [itemForm, setItemForm] = useState({ name: "", description: "", price: 0, moq: 1, category: "", is_available: true });
  
  const navigate = useNavigate();
  const user = getCurrentUser();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchSupplierProfile();
  }, [user]);

  const fetchSupplierProfile = async () => {
    setLoading(true);
    const { data: profile } = await supabase.from('suppliers').select('*').eq('owner_id', user.id).single();
    if (profile) {
      setSupplier(profile);
      fetchSupplierContent(profile.id);
    } else {
      setLoading(false);
    }
  };

  const fetchSupplierContent = async (supplierId) => {
    const [itemsRes, ordersRes] = await Promise.all([
      supabase.from('supplier_items').select('*').eq('supplier_id', supplierId).order('created_at', { ascending: false }),
      supabase.from('supplier_orders').select('*, shops(name)').eq('supplier_id', supplierId).order('created_at', { ascending: false })
    ]);
    if (itemsRes.data) setItems(itemsRes.data);
    if (ordersRes.data) setOrders(ordersRes.data);
    setLoading(false);
  };

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const { data, error } = await supabase.from('suppliers').insert({
      owner_id: user.id,
      name,
      is_verified: false
    }).select().single();
    if (data) setSupplier(data);
    else alert(error.message);
  };

  const addItem = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('supplier_items').insert({
      ...itemForm,
      supplier_id: supplier.id
    });
    if (!error) {
      setIsCreatingItem(false);
      setItemForm({ name: "", description: "", price: 0, moq: 1, category: "", is_available: true });
      fetchSupplierContent(supplier.id);
    } else {
      alert(error.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Supplier Portal...</div>;

  if (!supplier) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <span className="text-5xl mb-4 block">🚚</span>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Become a Supplier</h2>
          <p className="text-gray-500 mb-6">List your products for other shops to discover and order in bulk.</p>
          <form onSubmit={handleCreateSupplier} className="space-y-4">
            <input name="name" required placeholder="Supplier Name (e.g. Fresh Froduce Ltd)" className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" />
            <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition">Create Supplier Profile</button>
          </form>
          <div className="mt-6">
             <Link to="/dashboard" className="text-sm text-gray-400 hover:text-gray-600">← Back to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Link to="/dashboard" className="text-gray-400 hover:text-gray-600">←</Link>
             <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">{supplier.name} <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded ml-2">Wholesale Portal</span></h1>
          </div>
          <div className="flex items-center gap-2">
             {supplier.is_verified ? <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-bold">✓ Verified</span> : <span className="text-xs bg-yellow-50 text-yellow-600 px-2 py-1 rounded font-bold">Pending Verification</span>}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8 grid lg:grid-cols-[2fr_1fr] gap-8">
        
        {/* Catalog Section */}
        <section className="space-y-6">
           <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">Your Catalog</h2>
              <button onClick={() => setIsCreatingItem(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm">Add Item</button>
           </div>

           {isCreatingItem && (
              <div className="bg-white p-6 rounded-2xl border-2 border-indigo-100 shadow-sm animate-fade-in mb-6">
                 <div className="flex justify-between mb-4">
                    <h3 className="font-bold text-gray-900">New Catalog Item</h3>
                    <button onClick={() => setIsCreatingItem(false)} className="text-gray-400">✕</button>
                 </div>
                 <form onSubmit={addItem} className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                       <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Product Name</label>
                       <input value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} required className="w-full p-2.5 bg-gray-50 border rounded-lg text-sm" />
                    </div>
                    <div>
                       <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Wholesale Price (KSh)</label>
                       <input type="number" value={itemForm.price} onChange={e => setItemForm({...itemForm, price: parseFloat(e.target.value)})} required className="w-full p-2.5 bg-gray-50 border rounded-lg text-sm" />
                    </div>
                    <div>
                       <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Min Order Qty (MOQ)</label>
                       <input type="number" value={itemForm.moq} onChange={e => setItemForm({...itemForm, moq: parseInt(e.target.value)})} required className="w-full p-2.5 bg-gray-50 border rounded-lg text-sm" />
                    </div>
                    <button className="sm:col-span-2 bg-black text-white py-3 rounded-xl font-bold text-sm mt-2">Update Catalog</button>
                 </form>
              </div>
           )}

           <div className="grid gap-3">
              {items.length === 0 && !isCreatingItem && (
                 <div className="p-12 text-center bg-white rounded-3xl border border-dashed text-gray-400">Your catalog is empty</div>
              )}
              {items.map(item => (
                 <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
                    <div>
                       <p className="font-bold text-gray-800">{item.name}</p>
                       <p className="text-xs text-gray-500">KSh {item.price} · MOQ: {item.moq}</p>
                    </div>
                    <div className="flex gap-2">
                       <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${item.is_available ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          {item.is_available ? 'Available' : 'Out of Stock'}
                       </span>
                    </div>
                 </div>
              ))}
           </div>
        </section>

        {/* Orders Section */}
        <section className="space-y-6">
           <h2 className="text-lg font-bold text-gray-800">Wholesale Orders</h2>
           <div className="space-y-3">
              {orders.length === 0 && (
                 <div className="p-8 text-center bg-gray-100 rounded-2xl text-gray-400 text-sm">No orders yet</div>
              )}
              {orders.map(order => (
                 <div key={order.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                       <div>
                          <p className="text-xs font-bold text-gray-400 uppercase truncate">Order #{order.id.slice(0,8)}</p>
                          <p className="font-bold text-gray-800">{order.shops?.name || 'Shop'}</p>
                       </div>
                       <span className="text-[10px] bg-yellow-50 text-yellow-600 px-2 py-0.5 rounded font-bold capitalize">{order.status}</span>
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                       <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                       <p className="font-black text-indigo-600">KSh {order.total_amount}</p>
                    </div>
                 </div>
              ))}
           </div>
        </section>

      </main>
    </div>
  );
}
