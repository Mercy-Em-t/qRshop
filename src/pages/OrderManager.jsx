import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { getCurrentUser } from "../services/auth-service";
import { updateOrderStatus } from "../services/order-service";
import { useShopAgent } from "../hooks/use-shop-agent";
import { triggerMpesaStkPush } from "../services/payment-service";

// High-performance Binary Search Tree node for in-memory order index
class OrderBSTNode {
  constructor(order) {
    this.key = new Date(order.created_at).getTime();
    this.orders = [order];
    this.left = null;
    this.right = null;
  }
}

// Client-side Binary Search Tree for logarithmic range queries and instant sorting
class OrderBST {
  constructor() {
    this.root = null;
  }

  insert(order) {
    const node = new OrderBSTNode(order);
    if (!this.root) {
      this.root = node;
      return;
    }
    this._insertNode(this.root, node);
  }

  _insertNode(current, newNode) {
    if (newNode.key === current.key) {
      current.orders.push(...newNode.orders);
    } else if (newNode.key < current.key) {
      if (!current.left) current.left = newNode;
      else this._insertNode(current.left, newNode);
    } else {
      if (!current.right) current.right = newNode;
      else this._insertNode(current.right, newNode);
    }
  }

  searchRange(start, end) {
    const results = [];
    this._searchRangeNode(this.root, start, end, results);
    return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  _searchRangeNode(node, start, end, results) {
    if (!node) return;
    if (node.key >= start) this._searchRangeNode(node.left, start, end, results);
    if (node.key >= start && node.key <= end) results.push(...node.orders);
    if (node.key <= end) this._searchRangeNode(node.right, start, end, results);
  }
}

// Send a native OS or web fallback notification whenever a new order lands
async function notifyNewOrder(order) {
  try {
    const isTauri = typeof window !== 'undefined' && !!window.__TAURI__;
    
    // Play kitchen notification alert sound
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/911/911-200.wav");
    audio.play().catch(() => {});

    if (isTauri) {
      const { sendNotification, isPermissionGranted, requestPermission } = await import("@tauri-apps/plugin-notification");
      let permissionGranted = await isPermissionGranted();
      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
      }
      
      if (permissionGranted) {
        sendNotification({
          title: "🍳 New Order Received!",
          body: `Order for ${order.client_name || 'Guest'} - KSh ${order.total_price}`,
          sound: "Default"
        });
      }
    } else if (typeof window !== 'undefined' && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("🍳 New Order Received!", {
          body: `Order for ${order.client_name || 'Guest'} - KSh ${order.total_price}`
        });
      } else if (Notification.permission !== "denied") {
        const perm = await Notification.requestPermission();
        if (perm === "granted") {
          new Notification("🍳 New Order Received!", {
            body: `Order for ${order.client_name || 'Guest'} - KSh ${order.total_price}`
          });
        }
      }
    }
  } catch (err) {
    console.warn("Notification trigger failed silently:", err);
  }
}

// Live auto-expiration timer component for pending orders
function OrderCountdown({ order, onExpire, compact = false, shop }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const isWhatsApp = order.order_type === 'whatsapp';

  useEffect(() => {
    if (isWhatsApp) return; // WhatsApp orders never auto-expire

    const calculateTimeLeft = () => {
      const isGastro = shop?.industry_type === 'food' || shop?.industry_type === 'restaurant';
      const durationMin = isGastro ? 30 : 24 * 60; // 30 mins for food, 24 hours (1440 mins) for marketplace/retail
      const createdAt = new Date(order.created_at).getTime();
      const expirationTime = createdAt + durationMin * 60 * 1000;
      const now = Date.now();
      const difference = expirationTime - now;
      return Math.max(0, Math.floor(difference / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const left = calculateTimeLeft();
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(timer);
        onExpire(order.id);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [order, onExpire, isWhatsApp, shop]);

  if (isWhatsApp) {
    if (compact) {
      return (
        <span className="text-[10px] font-black tracking-widest text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
           💬 CHAT
        </span>
      );
    }
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700 font-black">
        <span className="text-xs">💬</span>
        <span className="text-[9px] tracking-wider uppercase">WhatsApp Negotiation</span>
      </div>
    );
  }

  if (timeLeft === null) return null;
  if (timeLeft <= 0) return <span className="text-rose-600 font-bold text-[10px] tracking-widest uppercase">EXPIRED</span>;

  const minutes = Math.floor(timeLeft / 60);
  const hours = Math.floor(minutes / 60);
  const displayMins = minutes % 60;
  const seconds = timeLeft % 60;
  
  let formattedTime = "";
  if (hours > 0) {
    formattedTime = `${hours}h ${displayMins}m`;
  } else {
    formattedTime = `${displayMins}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  const isUrgent = timeLeft < 120; // less than 2 minutes

  if (compact) {
    return (
      <span className={`text-[10px] font-black tracking-widest ${isUrgent ? 'text-rose-600 animate-pulse' : 'text-slate-500'}`}>
         ⏱️ {formattedTime}
      </span>
    );
  }

  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-xl border font-black transition-all ${
      isUrgent 
        ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse scale-105 shadow-sm shadow-rose-100' 
        : 'bg-slate-50 border-slate-200 text-slate-600'
    }`}>
      <span className="text-[10px] tracking-wider uppercase flex items-center gap-1">
        <span>⏱️</span> {isUrgent ? 'Expiring in' : 'Accept within'}
      </span>
      <span className="text-[10px] font-black tracking-wide font-mono">{formattedTime}</span>
    </div>
  );
}

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
  const [dateFilter, setDateFilter] = useState("all"); // "all", "today", "week"

  // Order revision editor state variables
  const [editedItems, setEditedItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [menuSearchQuery, setMenuSearchQuery] = useState("");
  const [selectedMenuItemId, setSelectedMenuItemId] = useState("");
  const [isSavingRevision, setIsSavingRevision] = useState(false);
  const [isOverrideTotal, setIsOverrideTotal] = useState(false);

  // Memoize high-performance BST index (Pruned to last 30 days to prevent memory bloat)
  const orderBST = useMemo(() => {
    const bst = new OrderBST();
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    orders.forEach(o => {
      const orderTime = new Date(o.created_at).getTime();
      if (orderTime >= thirtyDaysAgo) {
        bst.insert(o);
      }
    });
    return bst;
  }, [orders]);

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

    const fetchSingleOrder = async (orderId) => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select(`*, order_items (id, menu_item_id, quantity, price, menu_items (name))`)
          .eq("id", orderId)
          .single();
        if (!error && data) {
          setOrders(prev => {
            if (prev.some(o => o.id === orderId)) return prev;
            return [data, ...prev];
          });
        }
      } catch (err) {
        console.warn("Incremental single order fetch failed:", err);
      }
    };

    fetchOrders();
    fetchMenuItems();

    const channel = supabase
      .channel('kitchen-stream')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'orders',
        filter: `shop_id=eq.${SHOP_ID}` 
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          notifyNewOrder(payload.new);
          fetchSingleOrder(payload.new.id);
        } else {
          fetchOrders();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchMenuItems = async () => {
    if (!supabase || !SHOP_ID) return;
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("shop_id", SHOP_ID);
    if (!error && data) {
      setMenuItems(data);
    }
  };

  const fetchOrders = async () => {
    if (!supabase) return;
    const { data: shopData } = await supabase.from("shops").select("*").eq("shop_id", SHOP_ID).single();
    if (shopData) setShop(shopData);

    const { data: orderData, error } = await supabase
      .from("orders")
      .select(`*, order_items (id, menu_item_id, quantity, price, menu_items (name))`)
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
        console.error("Order status update failed:", error);
        alert(`Failed to update order status: ${error.message || 'Operation restricted or failed.'}`);
        return;
      }

      fetchOrders();
    } catch (err) {
      console.error("Order status update exception:", err);
      alert("Order service unavailable. Please check your connection.");
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

  const handleInvalidateMpesa = async (order) => {
    if (!window.confirm(`Are you sure you want to invalidate the M-Pesa code "${order.mpesa_code}"? The customer will be prompted to re-submit.`)) {
      return;
    }
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          mpesa_code: null,
          edit_reason: "INVALID_MPESA_CODE: The code you submitted was not recognized. Please check your transaction details and submit again."
        })
        .eq("id", order.id);
      
      if (error) {
        console.error("Failed to invalidate code:", error);
        alert(`Failed to invalidate code: ${error.message}`);
        return;
      }
      
      fetchOrders();
      alert("M-Pesa code invalidated successfully!");
    } catch (err) {
      console.error("Invalidate M-Pesa exception:", err);
      alert("Operation failed. Please try again.");
    }
  };

  const handleAutoExpire = async (orderId) => {
    try {
      console.log(`Order ${orderId} has auto-expired!`);
      const { error } = await supabase
        .from("orders")
        .update({ status: 'expired' })
        .eq("id", orderId);
      
      if (error) {
        console.warn("Auto-expire database update failed:", error.message);
        return;
      }
      fetchOrders();
    } catch (err) {
      console.warn("Auto-expire request failed:", err);
    }
  };

  const adjustQuantity = (index, delta) => {
    setEditedItems(prev => {
      const next = [...prev];
      const nextQty = next[index].quantity + delta;
      if (nextQty <= 0) {
        next.splice(index, 1);
      } else {
        next[index].quantity = nextQty;
      }
      return next;
    });
  };

  const removeItem = (index) => {
    setEditedItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    if (!selectedMenuItemId) return;
    const selectedItem = menuItems.find(mi => mi.id === selectedMenuItemId);
    if (!selectedItem) return;
    
    setEditedItems(prev => {
      const existingIndex = prev.findIndex(item => item.menu_item_id === selectedItem.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity += 1;
        return next;
      } else {
        return [
          ...prev,
          {
            menu_item_id: selectedItem.id,
            name: selectedItem.name,
            price: selectedItem.price,
            quantity: 1
          }
        ];
      }
    });
    
    setSelectedMenuItemId("");
    setMenuSearchQuery("");
  };

  const filteredMenuItems = useMemo(() => {
    if (!menuSearchQuery) return menuItems;
    const q = menuSearchQuery.toLowerCase();
    return menuItems.filter(item => 
      item.name.toLowerCase().includes(q) || 
      item.category?.toLowerCase().includes(q)
    );
  }, [menuItems, menuSearchQuery]);

  const handleSaveEdit = async () => {
    if (!editingOrder) return;
    setIsSavingRevision(true);
    try {
      // 1. Determine deleted items
      const originalItemIds = (editingOrder.order_items || []).map(item => item.id).filter(Boolean);
      const remainingItemIds = editedItems.map(item => item.id).filter(Boolean);
      const itemsToDelete = originalItemIds.filter(id => !remainingItemIds.includes(id));
      
      if (itemsToDelete.length > 0) {
        const { error: delError } = await supabase
          .from("order_items")
          .delete()
          .in("id", itemsToDelete);
        if (delError) throw delError;
      }
      
      // 2. Update existing items
      const existingItemsToUpdate = editedItems.filter(item => item.id);
      for (const item of existingItemsToUpdate) {
        const { error: updError } = await supabase
          .from("order_items")
          .update({
            quantity: item.quantity,
            price: item.price
          })
          .eq("id", item.id);
        if (updError) throw updError;
      }
      
      // 3. Insert new items
      const newItemsToInsert = editedItems.filter(item => !item.id);
      if (newItemsToInsert.length > 0) {
        const insertPayload = newItemsToInsert.map(item => ({
          order_id: editingOrder.id,
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          price: item.price
        }));
        const { error: insError } = await supabase
          .from("order_items")
          .insert(insertPayload);
        if (insError) throw insError;
      }

      // Calculate total
      const calculatedTotal = editedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const finalTotal = isOverrideTotal ? Number(editTotal) : calculatedTotal;

      // 4. Update order total & status
      const { error: orderError } = await supabase
        .from("orders")
        .update({ 
           total_price: finalTotal,
           status: 'pending_payment'
        })
        .eq("id", editingOrder.id);

      if (orderError) {
        console.warn("Revision rejected by server:", orderError.message);
        alert(`Failed to save revision: ${orderError.message}`);
        return;
      }

      setEditingOrder(null);
      fetchOrders();
      alert("Order revision published successfully!");
    } catch (err) {
      console.error("Unexpected Revision Error:", err);
      alert("An unexpected error occurred while saving the revision.");
    } finally {
      setIsSavingRevision(false);
    }
  };

  const handleRequestPayment = async (order) => {
    try {
      // 1. Update Status
      await updateOrderStatus(order.id, 'pending_payment');
      alert(`Manual Payment Requested from ${order.client_name || 'Customer'}`);
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
  
  const filteredOrders = useMemo(() => {
    let baseOrders = orders;
    
    if (dateFilter === "today") {
      const start = new Date();
      start.setHours(0,0,0,0);
      const end = new Date();
      end.setHours(23,59,59,999);
      baseOrders = orderBST.searchRange(start.getTime(), end.getTime());
    } else if (dateFilter === "week") {
      const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const end = new Date();
      baseOrders = orderBST.searchRange(start.getTime(), end.getTime());
    }

    return baseOrders.filter(o => {
      let matchesTab = false;
      if (activeTab === 'all') {
        matchesTab = true;
      } else if (activeTab === 'cancelled') {
        matchesTab = ['rejected', 'expired'].includes(o.status);
      } else {
        matchesTab = o.status === activeTab;
      }

      const s = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        (o.client_name?.toLowerCase().includes(s)) ||
        (o.client_phone?.includes(s)) ||
        (o.id.toLowerCase().includes(s));
      return matchesTab && matchesSearch;
    });
  }, [orders, orderBST, dateFilter, activeTab, searchTerm]);

  const [viewType, setViewType] = useState('grid'); // 'grid' or 'table'

  const STATS = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'pending_payment', label: 'Req Pay' },
    { id: 'paid', label: 'Paid' },
    { id: 'preparing', label: 'Prep' },
    { id: 'ready', label: 'Ready' },
    { id: 'completed', label: 'Fin' },
    { id: 'cancelled', label: 'Cancelled' },
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
                {/* Date BST Filter Selector */}
                <div className="relative">
                   <select
                     value={dateFilter}
                     onChange={(e) => setDateFilter(e.target.value)}
                     className="appearance-none bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 pr-8 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer transition-all"
                   >
                      <option value="all">All Dates</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                   </select>
                   <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                      <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                   </div>
                </div>
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
                         {order.order_type === 'whatsapp' && (
                            <span style={{background:'#dcf8c6', color:'#128C7E', padding:'2px 6px', borderRadius:'4px', fontSize:'9px', fontWeight:'bold'}}>💬 WhatsApp</span>
                         )}
                    </div>

                    {/* Live Auto-Expiration Timer for Pending Orders */}
                    {order.status === 'pending' && (
                       <div className="mb-4">
                          <OrderCountdown order={order} onExpire={handleAutoExpire} shop={shop} />
                       </div>
                    )}

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

                    <div className="relative mb-6">
                       <div className="space-y-2 border-y border-slate-50 py-4 max-h-40 overflow-y-auto no-scrollbar">
                          {order.order_items?.map((item, i) => (
                             <div key={i} className="flex justify-between text-xs font-semibold">
                                <span className="text-gray-600">{item.quantity}× {item.menu_items?.name}</span>
                             </div>
                          ))}
                       </div>
                       {order.order_items?.length > 4 && (
                          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none flex items-end justify-center pb-0.5">
                             <svg className="w-3.5 h-3.5 text-slate-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/>
                             </svg>
                          </div>
                       )}
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
                                          onClick={() => {
                                             setEditingOrder(order);
                                             setEditTotal(order.total_price);
                                             setIsOverrideTotal(false);
                                             
                                             const initialItems = (order.order_items || []).map(item => ({
                                                id: item.id,
                                                menu_item_id: item.menu_item_id,
                                                quantity: item.quantity,
                                                price: item.price,
                                                name: item.menu_items?.name || "Unknown Item"
                                             }));
                                             setEditedItems(initialItems);
                                             setMenuSearchQuery("");
                                             setSelectedMenuItemId("");
                                             setOverflowOpenId(null);
                                          }}
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
                           <div className="space-y-2">
                              <button 
                                 onClick={() => updateOrderStatus(order.id, 'paid')} 
                                 className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-green-100 transition-all"
                              >
                                 ✅ Confirm Cash / MPesa
                              </button>
                              {order.mpesa_code && (
                                 <button 
                                    onClick={() => handleInvalidateMpesa(order)} 
                                    className="w-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                                 >
                                    🚫 Invalidate M-Pesa Code
                                 </button>
                              )}
                           </div>
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
                          <div className="relative group cursor-pointer inline-block">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-green-600 transition-colors bg-slate-50 hover:bg-green-50 px-2.5 py-1.5 rounded-xl border border-slate-100/80 shadow-sm">
                              <span>📦 {order.order_items?.length || 0} {order.order_items?.length === 1 ? 'item' : 'items'}</span>
                              <svg className="w-3 h-3 text-slate-400 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"/>
                              </svg>
                            </div>
                            
                            {/* Dropdown breakdown card */}
                            <div className="absolute left-0 mt-2 w-72 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-2xl p-4 opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto transition-all duration-200 origin-top-left z-50 text-left">
                              <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Order Breakdown</span>
                                <span className="text-[9px] font-black text-green-600 uppercase bg-green-50 px-1.5 py-0.5 rounded">
                                  {order.order_items?.reduce((sum, item) => sum + item.quantity, 0)} Units
                                </span>
                              </div>
                              <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                                {order.order_items?.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-[11px] hover:bg-slate-50/50 p-1 rounded-lg transition-colors">
                                    <span className="font-semibold text-gray-700 truncate max-w-[180px]">
                                      {item.quantity}× {item.menu_items?.name || 'Unknown Item'}
                                    </span>
                                    <span className="font-black text-slate-500 font-mono">
                                      KSh {item.price * item.quantity}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Subtotal</span>
                                <span className="text-xs font-black text-gray-900">KSh {order.total_price}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                       <td className="px-6 py-4">
                         <span className="text-sm font-black text-gray-900">KSh {order.total_price}</span>
                       </td>
                       <td className="px-6 py-4">
                           <div className="flex flex-col gap-1 items-start">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight ${
                                 order.status === 'paid' ? 'bg-green-100 text-green-700' : 
                                 order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                 'bg-slate-100 text-slate-500'
                              }`}>{order.status.replace('_', ' ')}</span>
                              {order.status === 'pending' && (
                                 <OrderCountdown order={order} onExpire={handleAutoExpire} compact={true} shop={shop} />
                              )}
                           </div>
                        </td>
                       <td className="px-6 py-4 text-right">
                         <div className="flex justify-end gap-2 text-[10px] font-black uppercase">
                            {order.status === 'pending' && (
                               <button onClick={() => updateOrderStatus(order.id, 'accepted')} className="text-green-600 hover:underline">Accept</button>
                            )}
                            {['accepted', 'preparing'].includes(order.status) && (
                               <button onClick={() => updateOrderStatus(order.id, 'pending_payment')} className="text-amber-600 hover:underline">Bill</button>
                            )}
                            {order.status === 'pending_payment' && (
                               <>
                                  <button onClick={() => updateOrderStatus(order.id, 'paid')} className="text-green-600 hover:underline">Confirm Paid</button>
                                  {order.mpesa_code && (
                                     <button onClick={() => handleInvalidateMpesa(order)} className="text-rose-600 hover:underline">Invalidate Code</button>
                                  )}
                               </>
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
         <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
            <div className="bg-white/95 border border-slate-200/80 rounded-[32px] p-6 md:p-8 w-full max-w-md shadow-2xl backdrop-blur-xl relative animate-in fade-in zoom-in-95 duration-200 flex flex-col gap-5 max-h-[90vh]">
               <div className="flex justify-between items-start">
                  <div>
                     <span className="bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border border-amber-100">
                        Ref #{editingOrder.id.split('-')[0].toUpperCase()}
                     </span>
                     <h3 className="text-xl font-black text-gray-900 mt-2">✏️ Revise Order Items</h3>
                  </div>
                  <button 
                     onClick={() => setEditingOrder(null)} 
                     className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 hover:bg-slate-100 rounded-lg transition"
                     title="Close revision editor"
                  >
                     ✕
                  </button>
               </div>
               
               {/* Scrollable Revised Items List */}
               <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 max-h-60 pr-1 rounded-2xl p-4 bg-slate-50 border border-slate-100 shadow-inner">
                  {editedItems.map((item, index) => (
                     <div key={index} className="flex justify-between items-center text-xs bg-white p-3 rounded-xl border border-slate-100 shadow-sm transition-all hover:border-slate-200">
                        <div className="flex-1 min-w-0 pr-2">
                           <p className="font-bold text-gray-800 truncate">{item.name}</p>
                           <p className="text-[10px] text-slate-400 font-semibold mt-0.5">KSh {item.price} each</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                           <button
                              type="button"
                              onClick={() => adjustQuantity(index, -1)}
                              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm transition"
                           >
                              -
                           </button>
                           <span className="font-black text-slate-800 w-5 text-center">{item.quantity}</span>
                           <button
                              type="button"
                              onClick={() => adjustQuantity(index, 1)}
                              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm transition"
                           >
                              +
                           </button>
                           <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="ml-1 w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition"
                              title="Remove item"
                           >
                              ✕
                           </button>
                        </div>
                     </div>
                  ))}
                  {editedItems.length === 0 && (
                     <div className="text-center py-8 text-slate-400 text-xs italic font-medium">
                        No items in this order. Add menu items below.
                     </div>
                  )}
               </div>

               {/* Item Search & Selector */}
               <div className="border-t border-slate-100 pt-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                     <span>🔍</span> Add Items to Order
                  </h4>
                  <div className="flex gap-2 relative">
                     <div className="flex-1 relative">
                        <input
                           type="text"
                           placeholder="Type to search menu..."
                           value={menuSearchQuery}
                           onChange={e => setMenuSearchQuery(e.target.value)}
                           className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-500 bg-slate-50 focus:bg-white transition-all font-medium placeholder:font-normal"
                        />
                        {menuSearchQuery && (
                           <div className="absolute left-0 right-0 bottom-full mb-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-48 overflow-y-auto z-[60] border-slate-100 p-1.5 space-y-0.5">
                              {filteredMenuItems.map(item => (
                                 <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                       setSelectedMenuItemId(item.id);
                                       setMenuSearchQuery(item.name);
                                    }}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 rounded-xl border-b border-slate-50 last:border-0 flex justify-between font-bold"
                                 >
                                    <span className="text-gray-800">{item.name} <span className="text-[10px] text-slate-400 font-normal">({item.category})</span></span>
                                    <span className="text-green-600 font-black">KSh {item.price}</span>
                                 </button>
                              ))}
                              {filteredMenuItems.length === 0 && (
                                 <div className="p-3 text-center text-xs text-slate-400 font-semibold">No items found</div>
                              )}
                           </div>
                        )}
                     </div>
                     <button
                        type="button"
                        onClick={handleAddItem}
                        disabled={!selectedMenuItemId}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white px-5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md shadow-green-100"
                     >
                        Add
                     </button>
                  </div>
               </div>

               {/* Recalculated Total vs Override */}
               <div className="border-t border-slate-100 pt-3">
                  <div className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100">
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculated Subtotal</p>
                        <p className="text-xl font-black text-gray-900 mt-0.5">
                           KSh {editedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
                        </p>
                     </div>
                     <button
                        type="button"
                        onClick={() => setIsOverrideTotal(!isOverrideTotal)}
                        className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-lg border transition-all ${
                           isOverrideTotal 
                             ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm' 
                             : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        }`}
                     >
                        {isOverrideTotal ? '✓ Custom Applied' : '✎ Custom Price'}
                     </button>
                  </div>
                  
                  {isOverrideTotal && (
                     <div className="mt-3 bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50 animate-in slide-in-from-top-2 duration-200">
                        <label className="text-[9px] font-black text-amber-700 uppercase tracking-widest mb-1 block">Override Total Price (KSh)</label>
                        <input 
                           type="number" 
                           value={editTotal} 
                           onChange={e => setEditTotal(e.target.value)} 
                           className="w-full text-2xl font-black bg-transparent border-b border-amber-200 outline-none pb-1 text-gray-800 focus:border-amber-500 font-mono" 
                        />
                     </div>
                  )}
               </div>

               {/* Action Buttons */}
               <div className="grid gap-2 border-t border-slate-100 pt-3">
                  <button 
                     onClick={handleSaveEdit} 
                     disabled={isSavingRevision || editedItems.length === 0}
                     className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-green-150 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                     {isSavingRevision ? (
                        <>
                           <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                           </svg>
                           Publishing Revision...
                        </>
                     ) : 'Publish Revision'}
                  </button>
                  <button 
                     onClick={() => setEditingOrder(null)} 
                     disabled={isSavingRevision}
                     className="w-full bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-400 hover:text-slate-600 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all"
                  >
                     Discard
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
