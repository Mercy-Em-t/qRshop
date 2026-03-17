import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { useCart } from "../hooks/use-cart";
import LoadingSpinner from "../components/LoadingSpinner";
import { getQrSession } from "../utils/qr-session";
import usePlanAccess from "../hooks/usePlanAccess";

export default function EditOrder() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { loadRevision, clearCart } = useCart();
  const [error, setError] = useState(null);
  const session = getQrSession();
  const planAccess = usePlanAccess();

  useEffect(() => {
    async function loadOrder() {
      if (planAccess.loading) return;

      if (!planAccess.isPro) {
          setError("Smart Order Revisions are only available on the Pro plan.");
          return;
      }

      if (!supabase) {
        setError("Database not connected.");
        return;
      }

      try {
        // 1. Fetch Order
        const { data: order, error: orderErr } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (orderErr) throw orderErr;

        // Security check: Must belong to current QR session shop
        if (order.shop_id !== session?.shop_id) {
          throw new Error("Unauthorized access to this order.");
        }

        // 2. Fetch Order Items with product details
        const { data: items, error: itemsErr } = await supabase
          .from("order_items")
          .select(`
            id,
            quantity,
            price,
            menu_item_id,
            menu_items!inner (
              id,
              name,
              category
            )
          `)
          .eq("order_id", orderId);

        if (itemsErr) throw itemsErr;

        // 3. Reconstruct Cart Items Array
        const cartItems = items.map((i) => ({
          id: i.menu_items.id,
          name: i.menu_items.name,
          category: i.menu_items.category,
          price: i.price, // Preserve historical price
          quantity: i.quantity,
        }));

        // 4. Load into Hook State Context
        clearCart();
        loadRevision(order, cartItems);

        // 5. Success! Navigate to Cart
        navigate("/cart");
      } catch (err) {
        console.error("Failed to load order for editing:", err);
        setError(err.message || "Failed to retrieve the order.");
      }
    }

    loadOrder();
  }, [orderId, navigate, loadRevision, clearCart, session, planAccess]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 text-center">
         <div>
            <p className="text-4xl mb-4">⚠️</p>
            <h1 className="text-xl font-bold text-gray-800 mb-2">Order Not Found</h1>
            <p className="text-gray-500 mb-6">{error}</p>
            <button 
               onClick={() => navigate("/menu")} 
               className="bg-green-600 text-white px-6 py-2 rounded-xl font-medium"
            >
               Return to Menu
            </button>
         </div>
      </div>
    );
  }

  return <LoadingSpinner message="Rebuilding your cart..." />;
}
