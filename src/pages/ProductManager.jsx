import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { getCurrentUser, logout } from "../services/auth-service";
import usePlanAccess from "../hooks/usePlanAccess";
import UpgradeModal from "../components/UpgradeModal";
import { uuidToShort } from "../utils/short-id";

export default function ProductManager() {
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
  }, [user, navigate]);

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
    
    if (!editingId) {
      const FREE_PRODUCT_LIMIT = 20;
      const BASIC_PRODUCT_LIMIT = 100;

      const isAtFreeLimit = planAccess.isFree && !planAccess.isBasic && items.length >= FREE_PRODUCT_LIMIT;
      const isAtBasicLimit = planAccess.isBasic && !planAccess.isPro && items.length >= BASIC_PRODUCT_LIMIT;

      if (isAtFreeLimit) {
        setLockedFeatureFocus(`Expanded Product Catalog (${FREE_PRODUCT_LIMIT}+ Items)`);
        return;
      }
      if (isAtBasicLimit) {
        setLockedFeatureFocus(`Expanded Product Catalog (${BASIC_PRODUCT_LIMIT}+ Items on Basic)`);
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
       if (imageFile && newProductId) {
          try {
             setUploadProgress(10);
             const fileExt = imageFile.name.split('.').pop();
             const fileName = `${SHOP_ID}/${newProductId}-${Date.now()}.${fileExt}`;
             
             setUploadProgress(40);
             const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(fileName, imageFile);
                
             if (uploadError) throw uploadError;
             
             setUploadProgress(80);
             const { data: publicUrlData } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName);
                
             const publicUrl = publicUrlData.publicUrl;
             
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
     if (file.size > 5 * 1024 * 1024) {
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
    
    const headers = ["Name", "Category", "Price", "Description", "Stock", "SKU", "Product_Link", "Tags", "Variant_Options", "Image_URLs"];
    const csvRows = [headers.join(",")];
    
    for (const item of items) {
      const escapeCell = (str) => `"${String(str || "").replace(/"/g, '""')}"`;
      const tagsStr = Array.isArray(item.tags) ? item.tags.join(",") : "";
      const variantStr = (item.variant_options && Object.keys(item.variant_options).length > 0) ? JSON.stringify(item.variant_options) : "";
      
      const row = [
        escapeCell(item.name),
        escapeCell(item.category),
        item.price,
        escapeCell(item.description),
        item.stock || "",
        escapeCell(item.sku),
        escapeCell(item.product_link),
        escapeCell(tagsStr),
        escapeCell(variantStr),
        ""
      ];
      csvRows.push(row.join(","));
    }
    
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Modern_Savannah_Product_Catalog.csv");
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadTemplate = () => {
    const templateContent = [
      "Name,Category,Price,Description,Stock,SKU,Product_Link,Tags,Variant_Options,Image_URLs",
      "Signature Item,Main,750,High quality product description,50,SAV-01,,tag1,tag2,\"{\"\"size\"\":[\"\"Small\"\",\"\"Large\"\"]}\",https://example.com/p1.jpg"
    ].join("\n");
    
    const blob = new Blob([templateContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Savannah_Product_Template.csv");
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
                  i++;
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
      const imageCreations = [];
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
            validationErrors.push(`Row ${i + 1}: Price must be a valid number.`);
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
          alert(`CSV Validation Failed:\n- ${validationErrors.slice(0, 5).join('\n- ')}`);
          return;
      }

      if (bulkItems.length > 0) {
        if (planAccess.isFree && (items.length + bulkItems.length) > 20) {
            setLockedFeatureFocus("Expanded Product Catalog (20+ Items)");
            return;
        }
        
        if (!window.confirm(`Are you sure you want to import ${bulkItems.length} products?`)) return;

        setLoading(true);
        const { data: insertedItems, error } = await supabase.from('menu_items').insert(bulkItems).select();
        
        if (!error && insertedItems) {
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
           
           alert(`Successfully imported ${bulkItems.length} products!`);
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
      const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const randomChars = Math.random().toString(36).substr(2, 4);
      const shortId = `${slug}-${randomChars}`;

      const { error } = await supabase.from('qrs').insert({
          id: shortId,
          shop_id: item.shop_id,
          location: `AD:${item.id}`,
          action: 'open_order',
          status: 'active'
      });

      if (error && error.code !== '23505') throw error; 

      const baseUrl = window.location.origin;
      const link = `${baseUrl}/q/${shortId}`;
      
      navigator.clipboard.writeText(link);
      alert("✅ Product Link generated & copied!\n\nLink: " + link);
    } catch (err) {
      console.error("Link generation failed:", err);
      navigator.clipboard.writeText(`${window.location.origin}/buy/${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}?i=${uuidToShort(item.id)}`);
      alert("Product Link copied (Fallback generated).");
    }
  };

  const filteredItems = items.filter(item => {
    const s = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(s) || 
      item.description?.toLowerCase().includes(s) ||
      item.tags?.some(tag => tag.toLowerCase().includes(s));
    
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

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
          <h1 className="text-xl font-bold text-gray-800">Product Manager</h1>
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
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                 <h2 className="text-lg font-bold text-gray-900">Total Products ({items.length})</h2>
              </div>
              
              <div className="flex flex-wrap gap-2 w-full sm:w-auto relative">
                <button 
                  onClick={handleExportCSV}
                  className="bg-white text-gray-700 font-bold text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition shadow-sm"
                >
                   📥 Export
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setShowImportMenu(!showImportMenu)}
                    className="bg-indigo-50 text-indigo-700 font-bold text-sm px-4 py-2 rounded-lg hover:bg-indigo-100 transition border border-indigo-100 flex items-center gap-1"
                  >
                     📤 Import
                  </button>
                  {showImportMenu && (
                    <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-56 bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden transition-all duration-200 z-50">
                       <button 
                         onClick={() => { handleDownloadTemplate(); setShowImportMenu(false); }} 
                         className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-indigo-600 font-medium border-b border-gray-50 flex items-center gap-2"
                       >
                           📄 Download Template
                       </button>
                       <div className="relative hover:bg-gray-50 transition-colors">
                          <button className="w-full text-left px-4 py-3 text-sm text-gray-700 font-medium flex items-center gap-2">
                               ☁️ Upload CSV
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
                   {showAddForm ? "− Cancel" : "+ Add Product"}
                </button>
              </div>
           </div>

           {!showAddForm && (
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-50">
              <div className="sm:col-span-2 relative">
                 <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                 </span>
                 <input
                   type="text"
                   placeholder="Search items by name, category, or tags..."
                   value={searchTerm}
                   onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                   className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm focus:outline-none focus:bg-white transition"
                 />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                className="bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm font-medium text-gray-700 outline-none capitalize"
              >
                 {allCategories.map(cat => (
                   <option key={cat} value={cat}>{cat}</option>
                 ))}
              </select>
           </div>
           )}
        </div>

        {showAddForm && (
        <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
             <h2 className="text-lg font-bold text-gray-800">{editingId ? "Edit Product" : "New Product"}</h2>
          </div>
          <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Handmade Silk Scarf"
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
                <option value="Main">Primary Collection</option>
                <option value="Accessories">Accessories</option>
                <option value="Apparel">Apparel</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="md:col-span-2">
               <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
               <textarea
                 rows={3}
                 value={description}
                 onChange={(e) => setDescription(e.target.value)}
                 placeholder="Describe the unique features of your product..."
                 className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500 text-sm"
               />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (KSh)</label>
              <input
                required
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 2500"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div className="md:col-span-2 pt-2 border-t border-gray-100 mt-2">
               <h3 className="text-sm font-bold text-gray-800">Inventory & Links</h3>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Level</label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="Leave blank for unlimited"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU / ID</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. MS-001"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50"
              />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
               <input
                 type="text"
                 value={tags}
                 onChange={(e) => setTags(e.target.value)}
                 placeholder="e.g. limited, seasonal"
                 className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50"
               />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Direct Link (External/Digital)</label>
               <input
                 type="url"
                 value={productLink}
                 onChange={(e) => setProductLink(e.target.value)}
                 placeholder="https://..."
                 className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50"
               />
            </div>
            
            <div className="md:col-span-2 mt-4 flex gap-6 items-end">
               <div className="flex-1">
                 <label className="block text-sm font-medium text-gray-700 mb-2">Product Image (Max 5MB)</label>
                 <div className="flex items-center gap-4">
                    {imagePreview ? (
                       <div className="w-16 h-16 rounded-xl border border-gray-200 overflow-hidden relative shadow-sm">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => {setImageFile(null); setImagePreview(null);}} className="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-bl-lg text-xs font-bold">×</button>
                       </div>
                    ) : (
                       <div className="w-16 h-16 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400 font-bold">📷</div>
                    )}
                    <label className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-50 cursor-pointer transition">
                       Upload Image
                       <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleImageSelect} className="hidden" />
                    </label>
                 </div>
               </div>
            </div>

            <div className="flex items-end gap-2 md:col-span-1">
              <button
                type="submit"
                disabled={isAdding}
                className="w-full bg-green-600 text-white font-black py-3 rounded-xl hover:bg-green-700 transition disabled:opacity-50 uppercase tracking-widest text-xs"
              >
                {isAdding ? "Saving..." : editingId ? "Update Product" : "Save Product"}
              </button>
            </div>
          </form>
        </section>
        )}

        <section>
          {loading ? (
             <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="bg-white h-24 rounded-xl animate-pulse"></div>)}
             </div>
          ) : filteredItems.length === 0 ? (
             <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100 italic text-gray-400">
                No products discovered in this category.
             </div>
          ) : (
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y overflow-hidden">
                {currentItems.map((item) => (
                   <div key={item.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${item.is_active === false ? 'bg-gray-50/50 opacity-60' : 'hover:bg-gray-50/30'}`}>
                      <div className="min-w-0">
                         <div className="flex items-center gap-2">
                           <h3 className={`font-bold ${item.is_active === false ? 'text-gray-500' : 'text-gray-900'}`}>{item.name}</h3>
                           <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest bg-gray-100 text-gray-500">
                             {item.category}
                           </span>
                         </div>
                         <p className="text-xs text-gray-500 mt-0.5 font-mono">SKU: {item.sku || 'N/A'}</p>
                         <p className="text-sm font-black text-gray-900 mt-2">KSh {item.price}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                         <button onClick={() => generateAdLink(item)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg hover:rotate-12 transition-all" title="Get Share Link">
                            🔗
                         </button>
                         <button onClick={() => startEdit(item)} className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors" title="Edit Metadata">
                            ✏️
                         </button>
                         <button onClick={() => handleToggleActive(item.id, item.is_active)} className={`p-2 rounded-lg transition-colors ${item.is_active === false ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-red-50'}`} title={item.is_active === false ? "Live" : "Archive"}>
                            {item.is_active === false ? '👁️' : '🚫'}
                         </button>
                      </div>
                   </div>
                ))}
             </div>
          )}
          
          {totalPages > 1 && (
             <div className="flex items-center justify-center gap-4 mt-8">
                <button onClick={goToPrevPage} disabled={currentPage === 1} className="p-2 rounded-full hover:bg-white disabled:opacity-30">←</button>
                <span className="text-xs font-black uppercase tracking-tighter">Page {currentPage} / {totalPages}</span>
                <button onClick={goToNextPage} disabled={currentPage === totalPages} className="p-2 rounded-full hover:bg-white disabled:opacity-30">→</button>
             </div>
          )}
        </section>
      </main>
    </div>
  );
}
