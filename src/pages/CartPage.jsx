import { useNavigate } from "react-router-dom";
import { useCart } from "../hooks/use-cart";
import CartComponent from "../components/Cart";

export default function CartPage() {
  const navigate = useNavigate();
  const { items, addItem, removeItem, total } = useCart();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/menu")}
            className="text-green-600 font-medium hover:text-green-700 transition-colors cursor-pointer"
          >
            ← Back to Menu
          </button>
          <h1 className="text-xl font-bold text-gray-800">Your Cart</h1>
          <div className="w-24"></div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <CartComponent
          items={items}
          onAdd={addItem}
          onRemove={removeItem}
          total={total}
        />

        {items.length > 0 && (
          <button
            onClick={() => navigate("/order")}
            className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors cursor-pointer"
          >
            Confirm Order — KSh {total}
          </button>
        )}
      </main>
    </div>
  );
}
