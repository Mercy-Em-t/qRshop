import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { getCurrentUser, logout } from "../services/auth-service";
import usePlanAccess from "../hooks/usePlanAccess";
import UpgradeModal from "../components/UpgradeModal";
import { uuidToShort } from "../utils/short-id";

export default function MenuManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportMenu, setShowImportMenu] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [lockedFeatureFocus, setLockedFeatureFocus] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const navigate = useNavigate();
  const planAccess = usePlanAccess();

  const user = getCurrentUser();
  const SHOP_ID = user?.shop_id;

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Main");
  
  // eCommerce New Fields
  const [stock, setStock] = useState("");
  const [sku, setSku] = useState("");
  const [productLink, setProductLink] = useState("");
  const [tags, setTags] = useState("");
  
  // Image Upload State
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
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
    
    // Phase 23 + 36: Tiered Product Limit Gating
    if (!editingId) {
      const FREE_PRODUCT_LIMIT = 20;
      const BASIC_PRODUCT_LIMIT = 100;

      const isAtFreeLimit = planAccess.isFree && !planAccess.isBasic && items.length >= FREE_PRODUCT_LIMIT;
      const isAtBasicLimit = planAccess.isBasic && !planAccess.isPro && items.length >= BASIC_PRODUCT_LIMIT;

      if (isAtFreeLimit) {
        setLockedFeatureFocus(`Expanded Menu Catalog (${FREE_PRODUCT_LIMIT}+ Items)`);
        return;
      }
      if (isAtBasicLimit) {
        setLockedFeatureFocus(`Expanded Menu Catalog (${BASIC_PRODUCT_LIMIT}+ Items on Basic)`);
        return;
      }
    }

    setIsAdding(true);

    const parsedTags = tags ? tags.split(',').map(t=>t.trim()).filter(Boolean) : [];

    const payload = {
      name,
      description,
      price: parseFloat(price),
      category,
      stock: stock ? parseInt(stock) : -1,
      sku: sku || null,
      product_link: productLink || null,
      tags: parsedTags,
    };

    let error;
    let newProductId = editingId;

    if (editingId) {
       const res = await supabase.from("menu_items").update(payload).eq("id", editingId);
       error = res.error;
    } else {
       payload.shop_id = SHOP_ID;
       const res = await supabase.from("menu_items").insert(payload).select();
       error = res.error;
       if (res.data && res.data.length > 0) {
          newProductId = res.data[0].id;
       }
    }

    if (!error) {
       // Handle Image Upload if file exists
       if (imageFile && newProductId) {
          try {
             setUploadProgress(10);
             const fileExt = imageFile.name.split('.').pop();
             const fileName = `${SHOP_ID}/${newProductId}-${Date.now()}.${fileExt}`;
             
             setUploadProgress(40);
             const { data: uploadData, error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(fileName, imageFile);
                
             if (uploadError) throw uploadError;
             
             setUploadProgress(80);
             const { data: publicUrlData } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName);
                
             const publicUrl = publicUrlData.publicUrl;
             
             // Save to product_images table
             await supabase.from("product_images").insert({
                 product_id: newProductId,
                 url: publicUrl,
                 position: 0
             });
             
             setUploadProgress(100);
          } catch (imgErr) {
             console.error("Image upload failed:", imgErr);
             alert("Product saved, but image upload failed: " + imgErr.message);
          }
       }

       handleCancelEdit();
       fetchItems();
    } else {
      console.error("Failed to save item", error);
      alert("Error saving item: " + error.message);
    }
    setIsAdding(false);
    setUploadProgress(0);
  };

  const startEdit = (item) => {
     setEditingId(item.id);
     setName(item.name);
     setDescription(item.description || "");
     setPrice(item.price);
     setCategory(item.category);
     setStock(item.stock === -1 ? "" : item.stock);
     setSku(item.sku || "");
     setProductLink(item.product_link || "");
     setTags(item.tags ? item.tags.join(", ") : "");
     setImageFile(null);
     setImagePreview(null);
     setShowAddForm(true);
     window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
     setEditingId(null);
     setName("");
     setDescription("");
     setPrice("");
     setCategory("Main");
     setStock("");
     setSku("");
     setProductLink("");
     setTags("");
     setImageFile(null);
     setImagePreview(null);
     setShowAddForm(false);
  };
  
  const handleImageSelect = (e) => {
     const file = e.target.files[0];
     if (!file) return;
     if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("Image must be less than 5MB");
        return;
     }
     setImageFile(file);
     const objectUrl = URL.createObjectURL(file);
     setImagePreview(objectUrl);
  };

  const handleExportCSV = () => {
    if (items.length === 0) {
      alert("No items to export. Add some items to your catalog first!");
      return;
    }
    
    // Define exact CSV headers matching the import structure
    const headers = ["Name", "Category", "Price", "Description", "Stock", "SKU", "Product_Link", "Tags", "Variant_Options", "Image_URLs"];
    const csvRows = [headers.join(",")];
    
    for (const item of items) {
      // Escape internal double quotes by doubling them up, and wrap entire cell in double quotes for safety
      const escapeCell = (str) => `"${String(str || "").replace(/"/g, '""')}"`;
      
      const tagsStr = Array.isArray(item.tags) ? item.tags.join(",") : "";
      const variantStr = (item.variant_options && Object.keys(item.variant_options).length > 0) ? JSON.stringify(item.variant_options) : "";
      
      const row = [
        escapeCell(item.name),
        escapeCell(item.category),
        item.price, // Prices are just numbers
        escapeCell(item.description),
        item.stock || "",
        escapeCell(item.sku),
        escapeCell(item.product_link),
        escapeCell(tagsStr),
        escapeCell(variantStr),
        "" // Can't easily export sub-table image URLs in this flat structure right now
      ];
      csvRows.push(row.join(","));
    }
    
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
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
    const templateContent = [
      "Name,Category,Price,Description,Stock,SKU,Product_Link,Tags,Variant_Options,Image_URLs",
      "Signature Burger,Main,750,Double beef patty with special sauce,50,BURG-01,,beef,burger,\"{\"\"size\"\":[\"\"Single\"\",\"\"Double\"\"]}\",https://example.com/burger1.jpg|https://example.com/burger2.jpg",
      "Loaded Fries,Sides,300,Crispy fries topped with cheese and bacon,-1,FRIES-01,,,,",
      "Vanilla Shake,Drinks,400,Classic thick vanilla milkshake,100,SHK-01,,,,"
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

  const parseCSVRow = (text) => {
      let result = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < text.length; i++) {
         let char = text[i];
         if (inQuotes) {
            if (char === '"') {
               if (i + 1 < text.length && text[i + 1] === '"') {
                  current += '"';
                  i++; // skip escaped quote
               } else {
                  inQuotes = false;
               }
            } else {
               current += char;
            }
         } else {
            if (char === '"') {
               inQuotes = true;
            } else if (char === ',') {
               result.push(current);
               current = "";
            } else {
               current += char;
            }
         }
      }
      result.push(current);
      return result;
  };

  const handleBulkUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

      const reader = new FileReader();
    reader.onload = async (event) => {
      const csvData = event.target.result;
      const rows = csvData.split("\n");
      
      const bulkItems = [];
      const imageCreations = []; // parallel array of image arrays
      let validationErrors = [];

      const cleanStr = (str) => str ? str.trim() : "";

      for (let i = 1; i < rows.length; i++) {
        if (rows[i].trim() === "") continue;
        
        const row = parseCSVRow(rows[i]);
        if (row.length < 3) {
            validationErrors.push(`Row ${i + 1}: Missing required columns.`);
            continue;
        }

        const name = cleanStr(row[0]);
        const priceRaw = cleanStr(row[2]);

        if (!name) {
            validationErrors.push(`Row ${i + 1}: Product name is required.`);
            continue;
        }

        const parsedPrice = parseFloat(priceRaw);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            validationErrors.push(`Row ${i + 1}: Price must be a valid positive number.`);
            continue;
        }

        let parsedVariants = {};
        if (row.length >= 9 && cleanStr(row[8])) {
           try { parsedVariants = JSON.parse(cleanStr(row[8])); } 
           catch(err) { console.warn("Invalid variants JSON for item: " + name) }
        }

        let parsedTags = [];
        if (row.length >= 8 && cleanStr(row[7])) {
           parsedTags = cleanStr(row[7]).split(',').map(t=>t.trim()).filter(Boolean);
        }
        
        bulkItems.push({
           shop_id: SHOP_ID,
           name: name,
           category: cleanStr(row[1]) || "Main",
           price: parsedPrice,
           description: row.length >= 4 ? cleanStr(row[3]) : "",
           stock: (row.length >= 5 && cleanStr(row[4])) ? parseInt(row[4]) : -1,
           sku: row.length >= 6 ? (cleanStr(row[5]) || null) : null,
           product_link: row.length >= 7 ? (cleanStr(row[6]) || null) : null,
           tags: parsedTags,
           variant_options: parsedVariants,
        });
        
        const imageUrls = (row.length >= 10 && cleanStr(row[9])) ? cleanStr(row[9]).split('|') : [];
        imageCreations.push(imageUrls);
      }

      if (validationErrors.length > 0) {
          alert(`CSV Validation Failed:\n- ${validationErrors.slice(0, 5).join('\n- ')}\n${validationErrors.length > 5 ? `...and ${validationErrors.length - 5} more errors.` : ''}\nPlease fix these and try again.`);
          return;
      }

      if (bulkItems.length > 0) {
        // Phase 23: Strict Free-Tier Gating Logic
        if (planAccess.isFree && (items.length + bulkItems.length) > 20) {
            setLockedFeatureFocus("Expanded Menu Catalog (20+ Items)");
            return;
        }
        
        if (!window.confirm(`Are you sure you want to import ${bulkItems.length} products to your menu?`)) return;

        setLoading(true);
        // Supabase select() returns the generated rows (so we get the IDs for image mappings)
        const { data: insertedItems, error } = await supabase.from('menu_items').insert(bulkItems).select();
        
        if (!error && insertedItems) {
           // Insert images for the newly created products
           const imagePayloads = [];
           for (let i = 0; i < insertedItems.length; i++) {
              const productId = insertedItems[i].id;
              const urls = imageCreations[i];
              if (urls && urls.length > 0) {
                 urls.forEach((url, index) => {
                    imagePayloads.push({
                       product_id: productId,
                       url: url.trim(),
                       position: index
                    });
                 });
              }
           }
           
           if (imagePayloads.length > 0) {
              await supabase.from('product_images').insert(imagePayloads);
           }
           
           alert(`Successfully imported ${bulkItems.length} products with ${imagePayloads.length} images!`);
           fetchItems();
        } else {
           alert("Bulk upload failed: " + error?.message);
        }
        setLoading(false);
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleToggleActive = async (id, currentStatus) => {
    // If currentStatus is null/undefined, it means it's active.
    const newStatus = currentStatus === false;
    const { error } = await supabase.from("menu_items").update({ is_active: newStatus }).eq("id", id);
    if (!error) {
       setItems((items) => items.map(item => item.id === id ? { ...item, is_active: newStatus } : item));
    } else {
       alert("Error updating status: " + error.message);
    }
  };

  const generateAdLink = async (item) => {
    try {
      // Create a clean URL-friendly slug
      const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const randomChars = Math.random().toString(36).substr(2, 4);
      const shortId = `${slug}-${randomChars}`;

      // Insert as a digital QR code in the system, stealth-marked with AD: prefix
      const { error } = await supabase.from('qrs').insert({
          qr_id: shortId,
          shop_id: item.shop_id,
          location: `AD:${item.id}`,
          action: 'open_order',
          status: 'active'
      });

      if (error && error.code !== '23505') throw error; 

      const baseUrl = window.location.origin;
      const link = `${baseUrl}/q/${shortId}`;
      
      navigator.clipboard.writeText(link);
      alert("✅ Ultra-clean Ad link generated & copied!\n\nUse this in WhatsApp, Facebook, or SMS:\n" + link);
    } catch (err) {
      console.error("Link generation failed:", err);
      // Fallback
      navigator.clipboard.writeText(`${window.location.origin}/buy/${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}?i=${uuidToShort(item.id)}`);
      alert("Ad Link copied (Fallback generated).");
    }
  };

  // Filtering Logic
  const filteredItems = items.filter(item => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(s) || 
      item.description?.toLowerCase().includes(s) ||
      item.tags?.some(tag => tag.toLowerCase().includes(s));
    
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const goToNextPage = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
  const goToPrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));

  const allCategories = ["all", ...new Set(items.map(i => i.category))];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="text-green-600 font-medium hover:text-green-700 transition-colors"
          >
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Menu Catalog</h1>
          <div className="flex items-center">
             <button
               onClick={() => { logout(); navigate("/login"); }}
               className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
             >
               Logout
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {lockedFeatureFocus && (
          <UpgradeModal 
             featureName={lockedFeatureFocus} 
             onClose={() => setLockedFeatureFocus(null)} 
          />
        )}
        
        {/* ACTION BAR */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                 <h2 className="text-lg font-bold text-gray-900">Live Menu Catalog ({items.length})</h2>
              </div>
              
              <div className="flex flex-wrap gap-2 w-full sm:w-auto relative">
                <button 
                  onClick={handleExportCSV}
                  className="bg-white text-gray-700 font-bold text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition shadow-sm whitespace-nowrap"
                >
                   📥 Export
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setShowImportMenu(!showImportMenu)}
                    className="bg-indigo-50 text-indigo-700 font-bold text-sm px-4 py-2 rounded-lg hover:bg-indigo-100 transition whitespace-nowrap border border-indigo-100 flex items-center gap-1"
                  >
                     📤 Import
                  </button>
                  {showImportMenu && (
                    <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-56 bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden transition-all duration-200 origin-top-left sm:origin-top-right z-50">
                       <button 
                         onClick={() => { handleDownloadTemplate(); setShowImportMenu(false); }} 
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
                              onChange={(e) => { handleBulkUpload(e); setShowImportMenu(false); }}
                              className="absolute top-0 left-0 opacity-0 w-full h-full cursor-pointer"
                          />
                       </div>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => {
                     handleCancelEdit();
                     setShowAddForm(!showAddForm);
                  }}
                  className="bg-green-600 text-white font-bold text-sm px-5 py-2 rounded-lg shadow-sm hover:bg-green-700 transition"
                >
                   {showAddForm ? "− Cancel" : "+ Add Item"}
                </button>
              </div>
           </div>

           {/* Search & Filter Inputs */}
           {!showAddForm && (
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-50">
              <div className="sm:col-span-2 relative">
                 <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                 </span>
                 <input
                   type="text"
                   placeholder="Search products, descriptions, tags..."
                   value={searchTerm}
                   onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                   className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-green-500 focus:border-green-500 transition"
                 />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                className="bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm font-medium text-gray-700 focus:ring-green-500 focus:border-green-500 outline-none capitalize"
              >
                 {allCategories.map(cat => (
                   <option key={cat} value={cat}>{cat}</option>
                 ))}
              </select>
           </div>
           )}
        </div>

        {/* ADD / EDIT ITEM FORM */}
        {showAddForm && (
        <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 overflow-hidden transition-all animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
             <h2 className="text-lg font-bold text-gray-800">{editingId ? "Edit Item" : "Create New Item"}</h2>
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
            
            <div className="md:col-span-2 pt-2 pb-1 border-t border-gray-100 mt-2">
               <h3 className="text-sm font-bold text-gray-800">Advanced Inventory & eCommerce (Optional)</h3>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Level</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="Leave blank for infinite"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product SKU</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. BGR-01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Tags (comma separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. vegan, spicy, bestseller"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">External Buy Link / Digital Auto-Delivery Link</label>
              <input
                type="url"
                value={productLink}
                onChange={(e) => setProductLink(e.target.value)}
                placeholder="https://yourstore.com/item or Google Drive download link"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50"
              />
            </div>
            
            <div className="md:col-span-2 mt-4 flex gap-6 items-end">
               <div className="flex-1">
                 <label className="block text-sm font-medium text-gray-700 mb-2">Product Image (Max 5MB)</label>
                 <div className="flex items-center gap-4">
                    {imagePreview ? (
                       <div className="w-16 h-16 rounded-xl border border-gray-200 overflow-hidden relative shadow-sm">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          <button 
                            type="button" 
                            onClick={() => {setImageFile(null); setImagePreview(null);}}
                            className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-bl-lg text-xs font-bold"
                          >
                             ×
                          </button>
                       </div>
                    ) : (
                       <div className="w-16 h-16 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400">
                          📷
                       </div>
                    )}
                    <label className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-50 cursor-pointer shadow-sm transition">
                       Choose Image
                       <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleImageSelect} className="hidden" />
                    </label>
                 </div>
                 {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3">
                       <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                 )}
               </div>
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
                *Ensure images are under 5MB for fast loading.
             </p>
          )}
        </section>
        )}

        {/* LIST ITEMS (PAGINATED) */}
        <section>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="bg-white h-24 rounded-xl animate-pulse"></div>)}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100 flex flex-col items-center">
              <span className="text-4xl mb-4">🍽️</span>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No products found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your filters or search terms.</p>
              <button 
                onClick={() => { setSearchTerm(""); setCategoryFilter("all"); }} 
                className="text-green-600 font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y overflow-hidden">
                {currentItems.map((item, absoluteIdx) => {
                  const globalIndex = indexOfFirstItem + absoluteIdx;
                  const isFrozen = planAccess.isFree && !planAccess.isBasic && globalIndex >= 100;
                  
                  return (
                  <div key={item.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${item.is_active === false || isFrozen ? 'bg-gray-50/50 opacity-60' : 'hover:bg-gray-50/30'}`}>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`font-semibold ${item.is_active === false || isFrozen ? 'text-gray-500' : 'text-gray-800'}`}>
                          {item.name}
                        </h3>
                        {isFrozen && (
                           <span className="bg-slate-200 text-slate-700 text-[10px] px-2 py-0.5 rounded-full font-bold shadow-sm border border-slate-300">
                             ❄️ Frozen
                           </span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${item.is_active === false || isFrozen ? 'bg-gray-200 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                          {item.category}
                        </span>
                        {item.is_active === false && !isFrozen && (
                           <span className="bg-red-50 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-red-100">Offline</span>
                        )}
                      </div>
                      {item.description && <p className="text-xs text-gray-500 mt-1 truncate">{item.description}</p>}
                      <p className={`text-sm font-bold mt-1 ${item.is_active === false || isFrozen ? 'text-gray-400' : 'text-gray-900'}`}>KSh {item.price}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <button
                        onClick={(e) => {
                           e.currentTarget.disabled = true;
                           const btn = e.currentTarget;
                           generateAdLink(item).finally(() => btn.disabled = false);
                        }}
                        disabled={item.is_active === false || isFrozen}
                        className={`p-2 rounded-lg transition-colors ${item.is_active === false || isFrozen ? 'text-gray-300 cursor-not-allowed' : 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'}`}
                        title="Generate & Copy Semantic Link"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </button>
                      <button
                        onClick={() => {
                           if (isFrozen) {
                                setLockedFeatureFocus("Access to Frozen Items (Upgrade Required)");
                           } else {
                                startEdit(item);
                           }
                        }}
                        disabled={item.is_active === false}
                        className={`p-2 rounded-lg transition-colors ${item.is_active === false ? 'text-gray-300 cursor-not-allowed' : isFrozen ? 'text-slate-400 hover:text-slate-600' : 'text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50'}`}
                        title={isFrozen ? "Item Frozen - Upgrade Required" : "Edit Item"}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleToggleActive(item.id, item.is_active)}
                        className={`p-2 rounded-lg transition-colors ${item.is_active === false ? 'text-green-500 hover:text-green-700 hover:bg-green-50' : 'text-gray-400 hover:text-red-700 hover:bg-red-50'}`}
                        title={item.is_active === false ? "Reactivate Item" : "Deactivate Item"}
                      >
                        {item.is_active === false ? (
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                           </svg>
                        ) : (
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                             <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                           </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                   <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Page {currentPage} of {totalPages}</p>
                   <div className="flex gap-2">
                     <button 
                       onClick={goToPrevPage}
                       disabled={currentPage === 1}
                       className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
                     >
                        Previous
                     </button>
                     <button 
                       onClick={goToNextPage}
                       disabled={currentPage === totalPages}
                       className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
                     >
                        Next
                     </button>
                   </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
