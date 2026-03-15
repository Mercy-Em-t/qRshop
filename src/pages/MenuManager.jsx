import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase-client";

// Utilizing the persistent demo shop ID for the MVP
const SHOP_ID = "11111111-1111-1111-1111-111111111111";

export default function MenuManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Main");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("shop_id", SHOP_ID)
      .order("category", { ascending: true })
      .order("created_at", { ascending: false });

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setIsAdding(true);

    const { error } = await supabase.from("menu_items").insert({
      shop_id: SHOP_ID,
      name,
      description,
      price: parseFloat(price),
      category,
    });

    if (!error) {
      setName("");
      setDescription("");
      setPrice("");
      setCategory("Main");
      fetchItems();
    } else {
      console.error("Failed to add item", error);
    }
    setIsAdding(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this specific menu item?")) return;
    
    await supabase.from("menu_items").delete().eq("id", id);
    setItems((items) => items.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="text-green-600 font-medium hover:text-green-700 transition-colors"
          >
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Menu Catalog</h1>
          <div className="w-24"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* ADD ITEM FORM */}
        <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Add New Item</h2>
          <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Double Cheeseburger"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="Main">Main Event</option>
                <option value="Sides">Sides</option>
                <option value="Drinks">Drinks</option>
                <option value="Desserts">Desserts</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Two smashed beef patties with house sauce."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (KSh)</label>
              <input
                required
                type="number"
                min="0"
                step="10"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 500"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isAdding}
                className="w-full bg-green-600 text-white font-medium rounded-lg px-4 py-2 hover:bg-green-700 transition disabled:opacity-50"
              >
                {isAdding ? "Saving..." : "Add to Catalog"}
              </button>
            </div>
          </form>
        </section>

        {/* LIST ITEMS */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Live Menu Items ({items.length})</h2>
          {loading ? (
            <p className="text-center text-gray-500 py-8">Loading catalog...</p>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-100">
              <p className="text-gray-500">Your menu is currently empty.</p>
              <p className="text-sm text-gray-400 mt-1">Use the form above to add your first product!</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y overflow-hidden">
              {items.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800">{item.name}</h3>
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full font-medium">
                        {item.category}
                      </span>
                    </div>
                    {item.description && <p className="text-sm text-gray-500 mt-1">{item.description}</p>}
                    <p className="text-sm font-medium text-gray-700 mt-1">KSh {item.price}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete Item"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
