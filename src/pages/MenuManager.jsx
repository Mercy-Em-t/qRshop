import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase-client";

// Utilizing the persistent demo shop ID for the MVP
const SHOP_ID = "11111111-1111-1111-1111-111111111111";

export default function MenuManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

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

    const payload = {
      name,
      description,
      price: parseFloat(price),
      category,
    };

    let error;

    if (editingId) {
       const res = await supabase.from("menu_items").update(payload).eq("id", editingId);
       error = res.error;
    } else {
       payload.shop_id = SHOP_ID;
       const res = await supabase.from("menu_items").insert(payload);
       error = res.error;
    }

    if (!error) {
      handleCancelEdit();
      fetchItems();
    } else {
      console.error("Failed to save item", error);
      alert("Error saving item: " + error.message);
    }
    setIsAdding(false);
  };

  const startEdit = (item) => {
     setEditingId(item.id);
     setName(item.name);
     setDescription(item.description || "");
     setPrice(item.price);
     setCategory(item.category);
     window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
     setEditingId(null);
     setName("");
     setDescription("");
     setPrice("");
     setCategory("Main");
  };

  const handleExportCSV = () => {
    if (items.length === 0) {
      alert("No items to export. Add some items to your catalog first!");
      return;
    }
    
    // Define exact CSV headers matching the import structure
    const headers = ["Name", "Category", "Price", "Description"];
    const csvRows = [headers.join(",")];
    
    for (const item of items) {
      // Escape internal double quotes by doubling them up, and wrap entire cell in double quotes for safety
      const escapeCell = (str) => `"${String(str || "").replace(/"/g, '""')}"`;
      
      const row = [
        escapeCell(item.name),
        escapeCell(item.category),
        item.price, // Prices are just numbers
        escapeCell(item.description)
      ];
      csvRows.push(row.join(","));
    }
    
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    // Create an invisible anchor tag to trigger the browser's native download dialog
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "QR_Shop_Menu_Catalog.csv");
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadTemplate = () => {
    // Generate a dummy CSV row as a template
    const templateContent = [
      "Name,Category,Price,Description",
      "Signature Burger,Main,750,Double beef patty with special sauce",
      "Loaded Fries,Sides,300,Crispy fries topped with cheese and bacon",
      "Vanilla Shake,Drinks,400,Classic thick vanilla milkshake"
    ].join("\n");
    
    const blob = new Blob([templateContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "QR_Shop_Import_Template.csv");
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleBulkUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const csvData = event.target.result;
      const rows = csvData.split("\n");
      // Assuming headers: Name, Category, Price, Description
      
      const bulkItems = [];
      for (let i = 1; i < rows.length; i++) {
        // Simple distinct split allowing commas inside quotes is hard with simple split,
        // Assuming simple structure without inner commas for MVP
        const row = rows[i].split(",");
        if (row.length >= 3 && row[0].trim() !== "") {
           bulkItems.push({
              shop_id: SHOP_ID,
              name: row[0].trim(),
              category: row[1]?.trim() || "Main",
              price: parseFloat(row[2]) || 0,
              description: row[3]?.trim() || ""
           });
        }
      }

      if (bulkItems.length > 0) {
        setLoading(true);
        const { error } = await supabase.from('menu_items').insert(bulkItems);
        if (!error) {
           alert(`Successfully imported ${bulkItems.length} items!`);
           fetchItems();
        } else {
           alert("Bulk upload failed: " + error.message);
        }
        setLoading(false);
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reset input wrapper
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
        {/* ADD / EDIT ITEM FORM */}
        <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-lg font-bold text-gray-800">{editingId ? "Edit Item" : "Add New Item"}</h2>
             {!editingId && (
                <div className="flex gap-2 relative">
                  <button 
                    onClick={handleExportCSV}
                    className="bg-white text-gray-700 font-bold text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition shadow-sm whitespace-nowrap"
                  >
                     📥 Export CSV
                  </button>
                  <div className="relative group overflow-visible z-30">
                    <button className="bg-indigo-50 text-indigo-700 font-bold text-sm px-4 py-2 rounded-lg hover:bg-indigo-100 transition whitespace-nowrap border border-indigo-100 flex items-center gap-1">
                       📤 Import CSV ▼
                    </button>
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 origin-top-right">
                       <button 
                         onClick={handleDownloadTemplate} 
                         className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 font-medium border-b border-gray-50 flex items-center gap-2"
                       >
                           📄 Download Template
                       </button>
                       <div className="relative hover:bg-gray-50 transition-colors">
                          <button className="w-full text-left px-4 py-3 text-sm text-gray-700 font-medium flex items-center gap-2">
                              ☁️ Upload Filled CSV
                          </button>
                          <input 
                              type="file" 
                              accept=".csv"
                              onChange={handleBulkUpload}
                              className="absolute top-0 left-0 opacity-0 w-full h-full cursor-pointer"
                          />
                       </div>
                    </div>
                  </div>
                </div>
             )}
          </div>
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
            <div className="flex items-end gap-2">
              {editingId && (
                 <button
                   type="button"
                   onClick={handleCancelEdit}
                   className="w-1/3 bg-gray-100 text-gray-700 font-medium rounded-lg px-4 py-2 hover:bg-gray-200 transition"
                 >
                   Cancel
                 </button>
              )}
              <button
                type="submit"
                disabled={isAdding}
                className={`${editingId ? 'w-2/3' : 'w-full'} bg-green-600 text-white font-medium rounded-lg px-4 py-2 hover:bg-green-700 transition disabled:opacity-50`}
              >
                {isAdding ? "Saving..." : editingId ? "Update Item" : "Add to Catalog"}
              </button>
            </div>
          </form>
          {!editingId && (
             <p className="text-xs text-gray-400 mt-4 text-right">
                *CSV format req: Name, Category, Price, Description
             </p>
          )}
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
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(item)}
                      className="text-indigo-500 hover:text-indigo-700 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                      title="Edit Item"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                         <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
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
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
