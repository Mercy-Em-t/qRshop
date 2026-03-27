import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { getCurrentUser } from "../services/auth-service";

export default function SupplierDirectory() {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [catalog, setCatalog] = useState([]);
  const [cart, setCart] = useState({}); // { itemId: quantity }
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();
  const shopId = user?.shop_id;

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    // If admin, show all. If shop, only verified.
    const query = supabase.from('suppliers').select('*');
    if (user?.role !== 'system_admin') {
      query.eq('is_verified', true);
    }
    
    const { data, error } = await query;
    if (error) {
       console.error("Error fetching distributors:", error.message);
    }
    if (data) setSuppliers(data);
    setLoading(false);
  };

  const fetchCatalog = async (supplierId) => {
    setLoading(true);
    const { data } = await supabase.from('supplier_items').select('*').eq('supplier_id', supplierId).eq('is_available', true);
    if (data) setCatalog(data);
    setLoading(false);
  };

  const handleSelectSupplier = (s) => {
    setSelectedSupplier(s);
    setCatalog([]);
    setCart({});
    fetchCatalog(s.id);
  };

  const addToCart = (item) => {
    setCart(prev => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + (item.moq || 1)
    }));
  };

  const placeOrder = async (isMpesa = false) => {
    if (!shopId) {
      alert("You need to be logged in as a shop owner to place wholesale orders.");
      return;
    }
    if (Object.keys(cart).length === 0) return;
    setLoading(true);

    const mpesaPhone = isMpesa ? prompt("Enter M-Pesa Phone Number (254...):", "254") : null;
    if (isMpesa && !mpesaPhone) {
       setLoading(false);
       return;
    }
    
    let total = 0;
    const itemsToOrder = Object.entries(cart).map(([itemId, qty]) => {
      const item = catalog.find(i => i.id === itemId);
      total += item.price * qty;
      return { supplier_item_id: itemId, quantity: qty, price_at_order: item.price };
    });

    const { data: order, error } = await supabase.from('supplier_orders').insert({
      supplier_id: selectedSupplier.id,
      shop_id: shopId,
      total_amount: total,
      status: 'pending'
    }).select().single();

    if (order) {
      await supabase.from('supplier_order_items').insert(itemsToOrder.map(i => ({ ...i, order_id: order.id })));
      
      if (isMpesa) {
         // Trigger STK Push via Edge Function
         const { data, error: pushErr } = await supabase.functions.invoke('mpesa-stk-push', {
             body: { 
                 order_id: order.id,
                 phone: mpesaPhone, // Use the phone number from prompt
                 amount: total, // Use the calculated total
                 shop_id: shopId, // Use the current shop's ID
                 is_b2b: true // This is a B2B transaction
             }
         });

         if (pushErr) {
             console.error("STK Push invocation failed:", pushErr);
             alert("Failed to send M-Pesa STK Push. Please try again or place order without payment.");
         } else {
             alert("M-Pesa STK Push sent! Please enter your PIN on your phone.");
         }
      } else {
         alert("Order placed successfully! The supplier will contact you.");
      }
      
      setSelectedSupplier(null);
      setCart({});
    } else {
      alert(error.message);
    }
    setLoading(false);
  };

  if (loading && suppliers.length === 0) return <div className="p-8 text-center text-gray-500">Browsing Suppliers...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
       <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
             <div className="flex items-center gap-3">
                <Link to="/dashboard" className="text-gray-400 hover:text-gray-600">←</Link>
                <h1 className="text-xl font-black text-indigo-900 tracking-tight flex items-center gap-2">
                   📦 Supplier Hub
                </h1>
             </div>
             {selectedSupplier && (
                <button onClick={() => setSelectedSupplier(null)} className="text-sm font-bold text-gray-500">Back to List</button>
             )}
          </div>
       </header>

       <main className="max-w-6xl mx-auto p-4 md:p-8">
          {!selectedSupplier ? (
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {suppliers.length === 0 && <p className="text-center text-gray-400 col-span-full py-20">No verified suppliers found yet.</p>}
                {suppliers.map(s => (
                   <div key={s.id} onClick={() => handleSelectSupplier(s)} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl mb-4 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🏢</div>
                      <h3 className="text-lg font-black text-gray-800 mb-1">{s.name}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-4">{s.description || "Wholesale distributor providing quality goods to retail shops."}</p>
                      <button className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold">Browse Catalog</button>
                   </div>
                ))}
             </div>
          ) : (
             <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
                <div>
                   <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-3xl text-white mb-8 shadow-xl">
                      <h2 className="text-3xl font-black mb-2">{selectedSupplier.name}</h2>
                      <p className="opacity-80 text-sm max-w-md">{selectedSupplier.description}</p>
                   </div>

                   <h3 className="text-xl font-bold text-gray-800 mb-6">Wholesale Catalog</h3>
                   <div className="grid gap-4 sm:grid-cols-2">
                      {catalog.map(item => (
                         <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex gap-4 items-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-xl flex-shrink-0 flex items-center justify-center text-2xl">📦</div>
                            <div className="flex-1 min-w-0">
                               <p className="font-bold text-gray-800 truncate">{item.name}</p>
                               <p className="text-xs text-gray-500 mb-2">Price: KSh {item.price} · MOQ: {item.moq}</p>
                               <button 
                                 onClick={() => addToCart(item)}
                                 className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100"
                               >
                                 + Add to Wholesale Order
                               </button>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>

                <div className="sticky top-24">
                   <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100">
                      <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                         🛒 Wholesale Cart
                      </h3>
                      {Object.keys(cart).length === 0 ? (
                         <p className="text-center py-10 text-gray-400 text-sm italic">Add items to start a bulk order.</p>
                      ) : (
                         <div className="space-y-4">
                            {Object.entries(cart).map(([itemId, qty]) => {
                               const item = catalog.find(i => i.id === itemId);
                               return (
                                  <div key={itemId} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                     <div>
                                        <p className="font-bold text-gray-800">{item?.name}</p>
                                        <p className="text-[10px] text-gray-400">{qty} units @ KSh {item?.price}</p>
                                     </div>
                                     <button onClick={() => setCart(prev => {
                                        const next = {...prev};
                                        delete next[itemId];
                                        return next;
                                     })} className="text-red-400 hover:text-red-600">✕</button>
                                  </div>
                               );
                            })}
                            <div className="pt-4 mt-6 border-t font-black text-gray-900 flex justify-between text-lg">
                               <span>Total</span>
                               <span>KSh {Object.entries(cart).reduce((sum, [id, q]) => sum + (catalog.find(i => i.id === id)?.price || 0) * q, 0)}</span>
                            </div>
                            <button 
                              onClick={() => placeOrder(true)}
                              disabled={loading}
                              className="w-full bg-green-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm mt-4 hover:bg-green-700 transition shadow-lg shadow-green-100 flex items-center justify-center gap-2"
                            >
                               {loading ? 'Processing...' : (
                                  <>
                                     <span className="text-xl">💳</span> Pay via M-Pesa STK
                                  </>
                               )}
                            </button>

                            <button 
                              onClick={() => placeOrder(false)}
                              disabled={loading}
                              className="w-full bg-slate-100 text-slate-800 py-3 rounded-2xl font-bold text-sm mt-3 hover:bg-slate-200 transition"
                            >
                               Skip Payment (Order Only)
                            </button>
                            <p className="text-[10px] text-gray-400 text-center mt-3 uppercase tracking-tighter italic">Payments handled by Daraja STK Push</p>
                         </div>
                      )}
                   </div>
                </div>
             </div>
          )}
       </main>
    </div>
  );
}
