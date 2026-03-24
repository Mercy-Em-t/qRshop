import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { getCurrentUser, logout } from "../services/auth-service";
import usePlanAccess from "../hooks/usePlanAccess";
import UpgradeModal from "../components/UpgradeModal";

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [editingOrder, setEditingOrder] = useState(null);
  const [editTotal, setEditTotal] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [lockedFeatureFocus, setLockedFeatureFocus] = useState(null);
  const navigate = useNavigate();

  const user = getCurrentUser();
  const SHOP_ID = user?.shop_id;
  const planAccess = usePlanAccess();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
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
          menu_items (name, product_link)
        )
      `)
      .eq("shop_id", SHOP_ID)
      .order("created_at", { ascending: false });

    if (!error && orderData) {
      // Filter distinct topmost orders
      const activeOrdersMap = new Map();
      
      orderData.forEach(o => {
          const rootId = o.parent_order_id || o.id;
          if (!activeOrdersMap.has(rootId)) {
             // This is the newest one (since orderData is sorted descending by created_at)
             activeOrdersMap.set(rootId, { ...o, root_id: rootId, revision_count: 0 });
          } else {
             // This is an older revision, increment the counter on the topmost ticket
             const active = activeOrdersMap.get(rootId);
             active.revision_count += 1;
          }
      });

      setOrders(Array.from(activeOrdersMap.values()));
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

  const handleMpesaPush = async (order) => {
    let phone = order.client_phone;
    if (!phone || phone === "N/A") {
       phone = window.prompt(`Customer phone missing for receipt #${order.id.split('-')[0].toUpperCase()}.\nEnter a Safaricom number (e.g., 0712345678):`);
       if (!phone) return; // User cancelled
    }

    const originalStatus = order.status;
    updateOrderStatus(order.id, "stk_pushed");

    try {
      const response = await fetch("/api/mpesa/stkpush", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            phone: phone,
            amount: order.total_price,
            orderId: order.id
         })
      });
      
      const data = await response.json();
      if (!response.ok || !data.success) {
         throw new Error(data.error || "Failed to push STK.");
      }
      
      alert(data.data?.CustomerMessage || "M-Pesa prompt sent successfully to " + phone);
    } catch (err) {
      console.error(err);
      alert("M-Pesa Push Error: " + err.message);
      updateOrderStatus(order.id, originalStatus); // Revert status
    }
  };

  const handleSaveEdit = async () => {
    if (!editingOrder) return;
    
    const newTotal = parseFloat(editTotal);
    if (isNaN(newTotal) || newTotal < 0) {
       alert("Please enter a valid positive number for the new total.");
       return;
    }

    // Optimistic Update
    setOrders((current) =>
      current.map((o) => (o.id === editingOrder.id ? { ...o, status: "pending_payment", total_price: newTotal } : o))
    );

    const { error } = await supabase
      .from("orders")
      .update({ status: "pending_payment", total_price: newTotal })
      .eq("id", editingOrder.id);

    if (error) {
      console.error("Failed to save edited order:", error);
      fetchOrders();
    }
    setEditingOrder(null);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold uppercase">New Order</span>;
      case "pending_payment":
        return <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-bold uppercase">Awaiting Payment</span>;
      case "paid":
      case "preparing":
        return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold uppercase">Paid & Prep</span>;
      case "stk_pushed":
        return <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold uppercase animate-pulse">Awaiting PIN</span>;
      case "ready":
      case "completed":
        return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold uppercase">Completed</span>;
      case "archived":
        return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-bold uppercase">Archived</span>;
      case "rejected":
        return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold uppercase">Rejected</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-bold uppercase">{status}</span>;
    }
  };

  const toggleExpand = (id) => {
    setExpandedOrderId(prev => prev === id ? null : id);
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
          <div className="flex items-center">
            <button
               onClick={() => { logout(); navigate("/login"); }}
               className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer hidden sm:block"
             >
               Logout
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {lockedFeatureFocus && (
          <UpgradeModal 
             featureName={lockedFeatureFocus} 
             onClose={() => setLockedFeatureFocus(null)} 
          />
        )}
        
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

        {/* Top Summary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
           <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-gray-800">{orders.filter(o => o.status === "pending").length}</span>
              <span className="text-xs text-gray-500 font-bold uppercase mt-1">New</span>
           </div>
           <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-orange-500">{orders.filter(o => ["pending_payment", "stk_pushed"].includes(o.status)).length}</span>
              <span className="text-xs text-gray-500 font-bold uppercase mt-1">Awaiting Pay</span>
           </div>
           <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-blue-500">{orders.filter(o => ["paid", "preparing"].includes(o.status)).length}</span>
              <span className="text-xs text-gray-500 font-bold uppercase mt-1">Paid / Prep</span>
           </div>
           <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-green-500">{orders.filter(o => ["completed", "ready"].includes(o.status)).length}</span>
              <span className="text-xs text-gray-500 font-bold uppercase mt-1">Completed</span>
           </div>
        </div>

        {/* Segmented Pipeline Tabs */}
        <div className="flex bg-gray-200/50 p-1 rounded-xl mb-8 overflow-x-auto gap-1">
          {["all", "pending", "pending_payment", "paid", "completed", "rejected", "archived"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-lg font-semibold text-sm capitalize transition-all duration-200 ${
                activeTab === tab 
                  ? "bg-white text-gray-800 shadow-sm" 
                  : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
              }`}
            >
              {tab === "pending" ? "New Orders" 
                : tab === "pending_payment" ? "Awaiting Pay" 
                : tab === "paid" ? "Paid / Prep"
                : tab === "rejected" ? "Rejected"
                : tab}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-12">Listening for incoming orders...</p>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <span className="text-4xl">📭</span>
            <p className="text-gray-500 font-medium mt-4">No orders have been received yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders
              .filter((o) => {
                 if (activeTab === "all") return !["archived", "rejected"].includes(o.status); 
                 if (activeTab === "pending") return o.status === "pending";
                 if (activeTab === "pending_payment") return ["pending_payment", "stk_pushed"].includes(o.status);
                 if (activeTab === "paid") return ["paid", "preparing"].includes(o.status);
                 if (activeTab === "completed") return ["ready", "completed"].includes(o.status);
                 if (activeTab === "rejected") return o.status === "rejected";
                 if (activeTab === "archived") return o.status === "archived";
                 return true;
              })
              .filter(o => {
                 const idStr = String(o?.id || "");
                 const statStr = String(o?.status || "");
                 const query = searchQuery.toLowerCase();
                 return idStr.toLowerCase().includes(query) || statStr.toLowerCase().includes(query);
              })
              .map((order) => {
              const shortId = String(order?.id || "N/A").split("-")[0].toUpperCase();
              const isExpanded = expandedOrderId === order.id;
              
              return (
                <div key={order.id} className={`bg-white rounded-xl shadow-sm border ${isExpanded ? 'border-indigo-300 ring-2 ring-indigo-50' : 'border-gray-100'} overflow-hidden transition-all duration-200`}>
                  {/* Compact Header (Always Visible) */}
                  <div 
                     className="p-4 md:px-6 cursor-pointer hover:bg-gray-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                     onClick={() => toggleExpand(order.id)}
                  >
                     <div className="flex items-center gap-4">
                         <div className="flex flex-col gap-2">
                             <div className="flex flex-col">
                                 <span className="text-xs text-gray-400 font-bold uppercase">Receipt</span>
                                 <span className="font-mono text-gray-900 font-bold text-lg md:text-xl">
                                   #{shortId}
                                   {order.revision_count > 0 && (
                                      <span className="ml-2 bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full" title={`${order.revision_count} Revisions`}>
                                        R{order.revision_count}
                                      </span>
                                   )}
                                 </span>
                             </div>
                             {order.fulfillment_type === 'digital' ? (
                                <span className="bg-indigo-100 text-indigo-700 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase w-fit tracking-wider">💻 Digital Delivery</span>
                             ) : order.fulfillment_type === 'delivery' ? (
                                <span className="bg-purple-100 text-purple-700 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase w-fit tracking-wider">🚗 Delivery</span>
                             ) : order.fulfillment_type === 'pickup' ? (
                                <span className="bg-yellow-100 text-yellow-700 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase w-fit tracking-wider">🛍️ Pickup</span>
                             ) : (
                                <span className="bg-gray-100 text-gray-600 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase w-fit tracking-wider">🍽️ Table {order.table_id || 'N/A'}</span>
                             )}
                         </div>
                         <div className="hidden md:flex flex-col items-center justify-center border-l border-r border-gray-100 px-4 mx-2">
                            <span className="text-xs text-gray-400 font-bold uppercase mb-1">Time</span>
                            <span className="text-sm font-medium text-gray-700">
                               {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                         </div>
                         <div className="flex flex-col">
                            <span className="text-xs text-gray-400 font-bold uppercase mb-1">Total</span>
                            <span className="text-sm font-bold text-green-700">KSh {order.total_price}</span>
                         </div>
                     </div>
                     
                     <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                        {getStatusBadge(order.status)}
                        <button className="text-gray-400 hover:text-gray-600 transition p-2 bg-gray-50 rounded-full">
                           <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                           </svg>
                        </button>
                     </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                  <div className="p-4 md:px-6 border-t border-gray-100 bg-gray-50/30 flex flex-col md:flex-row gap-6">
                     
                     {/* Left: Items List */}
                     <div className="flex-1 space-y-2">
                        
                        {/* Customer & Fulfillment Info */}
                        <div className="mb-4 bg-white p-3 rounded-xl border border-gray-200 text-sm shadow-sm">
                           <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Customer Details</h4>
                           {(order.client_name || order.client_phone) && (
                              <p className="text-gray-800 font-bold mb-1.5 flex items-center gap-2">
                                 <span className="bg-gray-100 p-1 rounded">👤</span> 
                                 {order.client_name || "Guest"} 
                                 <span className="text-gray-400 font-normal ml-2">📞 {order.client_phone || "N/A"}</span>
                              </p>
                           )}
                           {order.fulfillment_type === 'delivery' && (
                              <p className="text-gray-600 font-medium flex items-start gap-2 mt-2 pt-2 border-t border-gray-100">
                                 <span className="bg-purple-50 text-purple-600 p-1 rounded text-xs">🚗 Address</span> 
                                 <span className="mt-0.5 leading-tight">{order.delivery_address || "No address provided"}</span>
                              </p>
                           )}
                           {order.fulfillment_type === 'digital' && (
                              <p className="text-indigo-700 font-medium flex items-center gap-2 mt-2 pt-2 border-t border-indigo-50">
                                 <span className="bg-indigo-100 p-1 rounded text-xs">📧 Email</span> 
                                 <span>{order.delivery_address || "No email provided"}</span>
                              </p>
                           )}
                           {order.fulfillment_type === 'pickup' && (
                              <p className="text-yellow-700 font-medium flex items-center gap-2 mt-2 pt-2 border-t border-yellow-50">
                                 <span className="bg-yellow-100 p-1 rounded text-xs">🛍️ Type</span> 
                                 <span>Customer Pickup</span>
                              </p>
                           )}
                        </div>

                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Order Items</h4>
                        {order.order_items?.map((item, idx) => {
                          const productLink = item.menu_items?.product_link;
                          return (
                            <div key={idx} className="flex flex-col text-sm bg-white p-2 rounded border border-gray-100">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700">
                                  <span className="font-semibold text-gray-900 mr-2">{item.quantity}x</span>
                                  {item.menu_items?.name || "Item"}
                                </span>
                                <span className="font-medium text-gray-600">KSh {item.price * item.quantity}</span>
                              </div>
                              {productLink && order.fulfillment_type === 'digital' && (
                                <div className="mt-2 text-xs flex items-center justify-between bg-indigo-50 text-indigo-800 px-2 py-1.5 rounded">
                                   <span className="font-mono truncate mr-2" title={productLink}>{productLink}</span>
                                   <button 
                                     onClick={() => {
                                        navigator.clipboard.writeText(productLink);
                                        alert("Link copied!");
                                     }}
                                      className="font-bold shrink-0 hover:text-indigo-600 cursor-pointer"
                                   >
                                      📄 Copy
                                   </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        
                        {order.discount_amount > 0 && (
                           <div className="bg-orange-50 text-orange-700 text-sm font-bold px-3 py-2 rounded-lg mt-3 flex justify-between items-center border border-orange-100">
                              <span>🔥 Code: {order.coupon_code || "DISCOUNT"}</span>
                              <span>-KSh {order.discount_amount}</span>
                           </div>
                        )}
                        {order.delivery_fee_charged > 0 && (
                           <div className="flex justify-between items-center p-2 rounded border border-gray-100 mt-2 text-sm bg-purple-50">
                              <span className="text-purple-800 font-bold">🚗 Delivery Fee</span>
                              <span className="font-medium text-purple-700">+KSh {order.delivery_fee_charged}</span>
                           </div>
                        )}

                        <div className="flex justify-between items-center pt-2 mt-2">
                          <span className="text-gray-500 font-medium text-sm">Final Total</span>
                          <span className="text-xl font-black text-green-700">KSh {order.total_price}</span>
                        </div>
                     </div>

                     {/* Right: Actions */}
                     <div className="w-full md:w-64 flex flex-col gap-2 justify-end bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 text-center">Manage Ticket</h4>
                        
                        {order.status === "pending" ? (
                          <>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                               <button
                                 onClick={() => updateOrderStatus(order.id, "pending_payment")}
                                 className="bg-green-600 text-white border border-green-700 font-bold py-2.5 rounded-lg hover:bg-green-700 shadow-sm transition text-xs flex items-center justify-center gap-1"
                               >
                                 ✅ Accept
                               </button>
                               <button
                                 onClick={() => updateOrderStatus(order.id, "rejected")}
                                 className="bg-red-50 text-red-600 border border-red-200 font-bold py-2.5 rounded-lg hover:bg-red-100 transition text-xs flex items-center justify-center gap-1"
                               >
                                 ❌ Reject
                               </button>
                            </div>
                            <button
                              disabled={true}
                              title="M-Pesa integration pending"
                              className="w-full bg-green-100 text-green-800 border border-green-300 font-bold py-2.5 rounded-lg hover:bg-green-200 transition text-xs flex items-center justify-center gap-2 mb-2"
                            >
                              📲 Push M-Pesa PIN (Soon)
                            </button>
                            <button
                              onClick={() => {
                                 if (!planAccess.isPro) {
                                    setLockedFeatureFocus("Smart Order Revisions");
                                    return;
                                 }
                                 setEditTotal(order.total_price);
                                 setEditingOrder(order);
                              }}
                              className={`w-full ${planAccess.isPro ? 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200' : 'bg-gray-100 text-gray-400 border-gray-200'} font-bold py-2.5 rounded-lg transition text-xs flex items-center justify-center gap-1 border`}
                            >
                              {!planAccess.isPro ? '🔒 ' : '✏️ '} Edit & Req. Pay
                            </button>
                          </>
                        ) : order.status === "pending_payment" ? (
                          <>
                            <button
                              disabled={true}
                              title="M-Pesa integration pending"
                              className="w-full bg-green-100 text-green-800 border border-green-300 font-bold py-3 rounded-lg hover:bg-green-200 transition shadow-sm mb-2 text-sm flex items-center justify-center gap-2"
                            >
                              📲 Push M-Pesa PIN (Soon)
                            </button>
                            <button
                              onClick={() => updateOrderStatus(order.id, "paid")}
                              className="w-full bg-indigo-600 text-white font-medium py-3 rounded-lg hover:bg-indigo-700 transition shadow-sm flex items-center justify-center gap-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              Confirm Pay Received
                            </button>
                          </>
                        ) : order.status === "stk_pushed" ? (
                           <>
                             <button
                               onClick={() => updateOrderStatus(order.id, "paid")}
                               className="w-full bg-indigo-600 text-white font-medium py-3 rounded-lg hover:bg-indigo-700 transition shadow-sm flex items-center justify-center gap-2 mb-2"
                             >
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                               Confirm Pay Received
                             </button>
                             <button
                               onClick={() => updateOrderStatus(order.id, "rejected")}
                               className="w-full bg-red-50 text-red-600 font-bold py-2.5 rounded-lg hover:bg-red-100 transition text-sm flex items-center justify-center gap-2"
                             >
                               ❌ Cancel Order
                             </button>
                           </>
                        ) : ["paid", "preparing"].includes(order.status) ? (
                          <>
                             <button
                               onClick={() => updateOrderStatus(order.id, "completed")}
                               className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition shadow-sm mb-2"
                             >
                               📦 Mark Completed
                             </button>
                             <button
                               onClick={() => updateOrderStatus(order.id, "rejected")}
                               className="w-full bg-red-50 text-red-600 font-bold py-2.5 rounded-lg hover:bg-red-100 transition text-sm flex items-center justify-center gap-2"
                             >
                               ❌ Cancel Order
                             </button>
                           </>
                        ) : ["ready", "completed"].includes(order.status) ? (
                          <button
                            onClick={() => updateOrderStatus(order.id, "archived")}
                            className="w-full bg-gray-800 text-white font-medium py-3 rounded-lg hover:bg-gray-900 transition flex items-center justify-center gap-2 shadow-sm"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                            Archive Ticket
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-full bg-gray-100 text-gray-400 font-medium py-3 rounded-lg cursor-not-allowed"
                          >
                            Archived
                          </button>
                        )}
                     </div>
                  </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Edit Order Total & Request Pay</h2>
            <p className="text-sm text-gray-500 mb-4">
              Receipt #{editingOrder.id.split("-")[0].toUpperCase()}<br/>
              Original Total: KSh {editingOrder.total_price}
            </p>
            <div className="mb-6">
               <label className="block text-sm font-semibold text-gray-700 mb-2">New Final Total (KSh)</label>
               <input 
                  type="number"
                  min="0"
                  step="0.01"
                  value={editTotal}
                  onChange={(e) => setEditTotal(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white text-lg font-bold"
               />
               <p className="text-xs text-gray-400 mt-2">Update the total to add manual service fees or ad-hoc items before requesting payment.</p>
            </div>
            <div className="flex gap-3">
               <button 
                  onClick={() => setEditingOrder(null)} 
                  className="flex-1 bg-gray-100 text-gray-600 font-semibold py-3 rounded-lg hover:bg-gray-200 transition"
               >
                  Cancel
               </button>
               <button 
                  onClick={handleSaveEdit}
                  className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition shadow-sm"
               >
                  Save & Publish
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
