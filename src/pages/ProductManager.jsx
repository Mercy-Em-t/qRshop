import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { fetchTemplates } from "../services/template-service";
import { getCurrentUser, logout } from "../services/auth-service";
import usePlanAccess from "../hooks/usePlanAccess";
import UpgradeModal from "../components/UpgradeModal";
import { uuidToShort } from "../utils/short-id";
import { generateSalesContent } from "../services/sales-content-generator";
import { normalizeAttributeKey } from "../utils/attribute-utils";
import VariationBuilder from "../components/VariationBuilder";
import AttributePanel from "../components/AttributePanel";

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
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'grid'
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
  const [subcategory, setSubcategory] = useState("");
  
  // eCommerce New Fields
  const [stock, setStock] = useState("");
  const [sku, setSku] = useState("");
  const [productLink, setProductLink] = useState("");
  const [salesHeadline, setSalesHeadline] = useState("");
  const [salesScript, setSalesScript] = useState("");
  const [tags, setTags] = useState("");
  
  // Image Upload State
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Template State
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [customFields, setCustomFields] = useState({});
  const [shopSchema, setShopSchema] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchItems();
    loadTemplates();
    fetchShopSchema();
  }, [user, navigate]);

  const fetchShopSchema = async () => {
    if (!SHOP_ID) return;
    const { data } = await supabase
       .from("shops")
       .select("custom_attributes_schema")
       .eq("shop_id", SHOP_ID)
       .single();
    
    if (data?.custom_attributes_schema) {
       setShopSchema(data.custom_attributes_schema);
    }
  };

  const loadTemplates = async () => {
     try {
        const data = await fetchTemplates(SHOP_ID);
        setAvailableTemplates(data);
     } catch (err) {
        console.error("Templates load error:", err);
     }
  };

  const fetchItems = async () => {
    if (items.length === 0) {
      setLoading(true);
    }
    
    const { data, error } = await supabase
      .from("menu_items")
      .select("*, product_images(url), product_sales_pages(*)")
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
      subcategory: subcategory || null,
      stock: stock ? parseInt(stock) : -1,
      sku: sku || null,
      product_link: productLink || null,
      tags: parsedTags,
      template_id: selectedTemplateId || null,
      attributes: {
         ...Object.keys(customFields).reduce((acc, key) => {
            acc[normalizeAttributeKey(key)] = customFields[key];
            return acc;
         }, {}),
      }
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
       // 1. Core save is successful - Update local state immediately for fast feedback
       if (editingId) {
          setItems(prev => prev.map(item => item.id === editingId ? { ...item, ...payload } : item));
       }

       // 2. Secondary Operations (Parallel & Background)
       const handleSecondaryOps = async () => {
          let imageUrl = null;
          
          // Image Flow
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
                
                const { data: publicUrlData } = supabase.storage
                   .from('product-images')
                   .getPublicUrl(fileName);
                   
                imageUrl = publicUrlData.publicUrl;
                
                // Parallelize secondary image records
                await Promise.all([
                   supabase.from("product_images").insert({
                       product_id: newProductId,
                       url: imageUrl,
                       position: 0
                   }),
                   supabase.from("menu_items").update({ image_url: imageUrl }).eq("id", newProductId)
                ]);
                
                setUploadProgress(100);
             } catch (imgErr) {
                console.error("Secondary image processing failed:", imgErr);
             }
          }

          // Background: AI Sales Content (Prioritize manual edits)
          try {
             let finalHeadline = salesHeadline;
             let finalScript = salesScript;

             // Auto-generate only if fields are empty
             if (!finalHeadline || !finalScript) {
                const generated = generateSalesContent({
                   name,
                   benefits: customFields.benefits || "",
                   processing: customFields.processing || "",
                   origin: customFields.origin || "",
                   nutrition_info: customFields.nutrition_info || "",
                   recipe: customFields.recipe || "",
                   category,
                   brand: customFields.brand || "",
                   diet_tags: Array.isArray(customFields.diet_tags) ? customFields.diet_tags : []
                });
                
                if (!finalHeadline) finalHeadline = generated.headline;
                if (!finalScript) finalScript = generated.sales_script;
             }

             await supabase.from("product_sales_pages").upsert({
                product_id: newProductId,
                headline: finalHeadline,
                sales_script: finalScript,
                is_published: true
             }, { onConflict: 'product_id' });
          } catch (salesErr) {
             console.warn("Background sales content processing failed:", salesErr);
          }
          
          // Final Refresh if we are adding new
          if (!editingId) fetchItems();
       };

       // Run secondary ops in parallel to the UI completion
       handleSecondaryOps();

       // 3. Immediate UI Completion
       setIsAdding(false);
       setShowAddForm(false);
       resetForm();
       if (editingId) setEditingId(null);
    } else {
       console.error("Save error:", error);
       alert("Error saving product: " + error.message);
       setIsAdding(false);
    }
    setUploadProgress(0);
  };

  const resetForm = () => {
     setName("");
     setDescription("");
     setPrice("");
     setCategory("Main");
     setSubcategory("");
     setStock("");
     setSku("");
     setProductLink("");
     setTags("");
     setSelectedTemplateId("");
     setCustomFields({});
     setImageFile(null);
     setImagePreview(null);
     setSalesHeadline("");
     setSalesScript("");
  };

  const startEdit = (item) => {
     setEditingId(item.id);
     setName(item.name || "");
     setDescription(item.description || "");
     setPrice(item.price || "");
     setCategory(item.category || "Main");
     setSubcategory(item.subcategory || "");
     setStock(item.stock === -1 ? "" : (item.stock || ""));
     setSku(item.sku || "");
     setProductLink(item.product_link || "");
     setTags(item.tags ? item.tags.join(", ") : "");
      
      const unifiedAttributes = {
        ...(item.attributes || {}),
        benefits: item.benefits || item.attributes?.benefits || "",
        usage_instructions: item.usage_instructions || item.attributes?.usage_instructions || "",
        origin: item.origin || item.attributes?.origin || "",
        processing: item.processing || item.attributes?.processing || "",
        nutrition_info: item.nutrition_info || item.attributes?.nutrition_info || "",
        recipe: item.recipe || item.attributes?.recipe || "",
        brand: item.brand || item.attributes?.brand || "",
        diet_tags: item.diet_tags || item.attributes?.diet_tags || []
      };

      Object.keys(unifiedAttributes).forEach(k => {
        if (unifiedAttributes[k] === null || unifiedAttributes[k] === undefined) {
          delete unifiedAttributes[k];
        }
      });

      setCustomFields(unifiedAttributes);
      setSelectedTemplateId(item.template_id || "");
      
      const sp = item.product_sales_pages?.[0];
      setSalesHeadline(sp?.headline || "");
      setSalesScript(sp?.sales_script || "");

     setImageFile(null);
     setImagePreview(null);
     setShowAddForm(true);
     window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
     setEditingId(null);
     resetForm();
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
    
     const headers = ["ID", "Name", "Category", "Sub-category", "Price", "Description", "Stock", "SKU", "Product_Link", "Tags", "Variant_Options", "Image_URL", "Attributes"];
     const csvRows = [headers.join(",")];
     
     for (const item of items) {
       const escapeCell = (str) => `"${String(str || "").replace(/"/g, '""')}"`;
       const tagsStr = Array.isArray(item.tags) ? item.tags.join(",") : "";
       const variantStr = (item.variant_options && Object.keys(item.variant_options).length > 0) ? JSON.stringify(item.variant_options) : "";
       const attributesStr = (item.attributes && Object.keys(item.attributes).length > 0) ? JSON.stringify(item.attributes) : "";
       
       const row = [
         item.id,
         escapeCell(item.name),
         escapeCell(item.category),
         escapeCell(item.subcategory),
         item.price || 0,
         escapeCell(item.description),
         item.stock || "",
         escapeCell(item.sku),
         escapeCell(item.product_link),
         escapeCell(tagsStr),
         escapeCell(variantStr),
         item.image_url || "",
         escapeCell(attributesStr)
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
       "ID,Name,Category,Sub-category,Price,Description,Stock,SKU,Product_Link,Tags,Variant_Options,Image_URL,Attributes",
       ",Signature Item,Main,Premium,750,High quality product description,50,SAV-01,,tag1,tag2,\"{\"\"size\"\":[\"\"Small\"\",\"\"Large\"\"]}\",https://example.com/p1.jpg,\"{\"\"brand\"\":\"\"Savannah\"\",\"\"origin\"\":\"\"Kenya\"\"}\""
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
      let validationErrors = [];

      const cleanStr = (str) => str ? str.trim() : "";

      for (let i = 1; i < rows.length; i++) {
        if (rows[i].trim() === "") continue;
        
        const row = parseCSVRow(rows[i]);
        const hasId = row.length >= 12;
        const offset = hasId ? 1 : 0;

        if (row.length < (3 + offset)) {
            validationErrors.push(`Row ${i + 1}: Missing required columns.`);
            continue;
        }

        const id = hasId ? cleanStr(row[0]) : null;
        const name = cleanStr(row[0 + offset]);
        const category = cleanStr(row[1 + offset]) || "Main";
        const subcategory = cleanStr(row[2 + offset]) || "";
        const priceRaw = cleanStr(row[3 + offset]);

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
        if (row.length >= (10 + offset) && cleanStr(row[9 + offset])) {
           try { parsedVariants = JSON.parse(cleanStr(row[9 + offset])); } 
           catch(err) { console.warn("Invalid variants JSON for item: " + name) }
        }

        let parsedTags = [];
        if (row.length >= (9 + offset) && cleanStr(row[8 + offset])) {
           parsedTags = cleanStr(row[8 + offset]).split(',').map(t=>t.trim()).filter(Boolean);
        }
        
        let parsedAttributes = {};
        if (row.length >= (13 + offset) && cleanStr(row[12 + offset])) {
           try { 
              const rawAttr = cleanStr(row[12 + offset]);
              parsedAttributes = JSON.parse(rawAttr); 
           } 
           catch(err) { console.warn("Invalid attributes JSON for item: " + name) }
        }
        
        const imageUrl = (row.length >= (11 + offset) && cleanStr(row[10 + offset])) ? cleanStr(row[10 + offset]) : null;

        const itemData = {
           shop_id: SHOP_ID,
           name: name,
           category: category,
           subcategory: subcategory || null,
           price: parsedPrice,
           description: row.length >= (5 + offset) ? cleanStr(row[4 + offset]) : "",
           stock: (row.length >= (6 + offset) && cleanStr(row[5 + offset])) ? parseInt(row[5 + offset]) : -1,
           sku: row.length >= (7 + offset) ? (cleanStr(row[6 + offset]) || null) : null,
           product_link: row.length >= (8 + offset) ? (cleanStr(row[7 + offset]) || null) : null,
           tags: parsedTags,
           variant_options: parsedVariants,
           image_url: imageUrl,
           attributes: parsedAttributes
        };

        if (id && id.length > 10) {
           itemData.id = id;
        }

        bulkItems.push(itemData);
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
        
        const isUpdate = bulkItems.some(item => item.id);
        const msg = isUpdate 
           ? `Are you sure you want to Sync/Update ${bulkItems.length} products?`
           : `Are you sure you want to import ${bulkItems.length} new products?`;

        if (!window.confirm(msg)) return;

        setLoading(true);
        // Using upsert to support updates via CSV
        const { error } = await supabase.from('menu_items').upsert(bulkItems, { 
           onConflict: 'id',
           ignoreDuplicates: false 
        });
        
        if (!error) {
           alert(isUpdate ? "✅ Catalog synced successfully!" : "✅ Products imported successfully!");
           fetchItems();
        } else {
           console.error("Bulk upload error:", error);
           alert("Failed to upload items. Check console for details.");
           setLoading(false);
        }
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
      const shortId = Math.random().toString(36).substring(7).toUpperCase();
      const nodeId = `AL-${shortId}`;
      const { data: qrNode, error: qrError } = await supabase
        .from('qrs')
        .insert([{
          qr_id: nodeId,
          shop_id: SHOP_ID,
          location: `AD:${item.id}`,
          action: 'open_order',
          qr_mode: 'direct_buy'
        }])
        .select()
        .single();

      if (qrError && qrError.code !== '23505') throw qrError; 

      const baseUrl = window.location.origin;
      const link = `${baseUrl}/q/${nodeId}`;
      
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
            to="/a"
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
                  onClick={() => navigate("/a/bulk-image-mapper")}
                  className="bg-purple-50 text-purple-700 font-bold text-sm px-4 py-2 rounded-lg border border-purple-100 hover:bg-purple-100 transition shadow-sm flex items-center gap-2"
                >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                   <span>Bulk Images</span>
                </button>
                <button 
                  onClick={handleExportCSV}
                  className="bg-white text-gray-700 font-bold text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition shadow-sm flex items-center gap-2"
                >
                   <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                   <span>Export</span>
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setShowImportMenu(!showImportMenu)}
                    className="bg-indigo-50 text-indigo-700 font-bold text-sm px-4 py-2 rounded-lg hover:bg-indigo-100 transition border border-indigo-100 flex items-center gap-2"
                  >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                     <span>Import</span>
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
                     if (showAddForm) handleCancelEdit();
                     else setShowAddForm(true);
                  }}
                  className="bg-green-600 text-white font-bold text-sm px-5 py-2 rounded-lg shadow-sm hover:bg-green-700 transition"
                >
                   {showAddForm ? "− Cancel" : "+ Add Product"}
                </button>
              </div>
           </div>

            {!showAddForm && (
            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-50 items-center justify-between">
               <div className="relative flex-1 w-full">
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
               
               <div className="flex items-center gap-2 w-full sm:w-auto">
                 <select
                   value={categoryFilter}
                   onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                   className="bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm font-medium text-gray-700 outline-none capitalize flex-1 sm:flex-none"
                 >
                    {allCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                 </select>

                  <div className="flex border border-gray-200 rounded-lg overflow-hidden shrink-0">
                    <button 
                      onClick={() => setViewMode("list")}
                      className={`px-3 py-2 text-xs font-bold transition-colors ${viewMode === 'list' ? 'bg-green-600 text-white shadow-inner' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                      title="List View"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                    <button 
                      onClick={() => setViewMode("grid")}
                      className={`px-3 py-2 text-xs font-bold transition-colors ${viewMode === 'grid' ? 'bg-green-600 text-white shadow-inner' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                      title="Grid View"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                    </button>
                  </div>
               </div>
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
              <input
                type="text"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Apparel, Food, Electronics"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
                list="category-suggestions"
              />
              <datalist id="category-suggestions">
                <option value="Food" />
                <option value="Drink" />
                <option value="Apparel" />
                <option value="Accessories" />
                <option value="Home & Decor" />
                <option value="Digital" />
                <option value="Services" />
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sub-category</label>
              <input
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="e.g. Men's Wear, Organic, PDF"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500"
              />
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

              <div className="md:col-span-2 py-6 border-t border-gray-100">
                 <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    ✨ Marketing AI Copy
                    <span className="text-[10px] font-normal text-gray-400 normal-case tracking-normal">(Auto-generated if left blank)</span>
                 </h3>
                 <div className="space-y-4">
                    <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Marketing Headline</label>
                       <input 
                          type="text"
                          value={salesHeadline}
                          onChange={e => setSalesHeadline(e.target.value)}
                          placeholder="e.g. Experience the purest organic blend..."
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                       />
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Sales Script / Hook</label>
                       <textarea 
                          rows={3}
                          value={salesScript}
                          onChange={e => setSalesScript(e.target.value)}
                          placeholder="Write a compelling story or hook for this product..."
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                       />
                    </div>
                 </div>
              </div>

              <div className="md:col-span-2 py-6 border-t border-gray-100">
                 <AttributePanel 
                    category={category}
                    currentAttributes={customFields}
                    onChange={setCustomFields}
                    shopSchema={shopSchema}
                 />
              </div>

             {selectedTemplateId && (
                <div className="md:col-span-2 p-6 bg-indigo-50/20 rounded-2xl border border-indigo-100/50 space-y-4">
                   <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 italic">Building based on {availableTemplates.find(t => t.id === selectedTemplateId)?.name} blueprint</p>
                   <div className="grid md:grid-cols-2 gap-4">
                      {availableTemplates.find(t => t.id === selectedTemplateId)?.product_template_fields?.map(field => (
                          <div key={field.id}>
                             <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{field.label}</label>
                             {field.field_type === 'textarea' ? (
                                <textarea 
                                   value={customFields[field.field_key] || ""}
                                   onChange={e => setCustomFields({...customFields, [field.field_key]: e.target.value})}
                                   className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                />
                             ) : (
                                <input 
                                   type={field.field_type}
                                   value={customFields[field.field_key] || ""}
                                   onChange={e => setCustomFields({...customFields, [field.field_key]: e.target.value})}
                                   className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                />
                             )}
                          </div>
                      ))}
                   </div>
                </div>
             )}

             <div className="md:col-span-2 flex items-center gap-4 py-4">
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

            <div className="flex items-end gap-2 md:col-span-1 pt-4">
              <button
                type="submit"
                disabled={isAdding}
                className="w-full bg-green-600 text-white font-black py-4 rounded-xl hover:bg-green-700 transition disabled:opacity-50 uppercase tracking-widest text-xs shadow-lg shadow-green-100"
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
          ) : viewMode === "list" ? (
             <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y overflow-hidden">
                {currentItems.map((item) => (
                   <div key={item.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${item.is_active === false ? 'bg-gray-50/50 opacity-60' : 'hover:bg-gray-50/30'}`}>
                       <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                             {item.product_images && item.product_images.length > 0 ? (
                                <img src={item.product_images[0].url} alt="" className="w-full h-full object-cover" />
                             ) : item.image_url ? (
                                <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-[9px] font-bold uppercase tracking-tighter">No Pic</div>
                             )}
                          </div>
                          
                          <div className="min-w-0">
                             <div className="flex items-center gap-2">
                               <h3 className={`font-bold ${item.is_active === false ? 'text-gray-500' : 'text-gray-900'} truncate`}>{item.name}</h3>
                               <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest bg-gray-100 text-gray-500 flex-shrink-0">
                                 {item.category}
                               </span>
                             </div>
                             <p className="text-[10px] text-gray-500 mt-0.5 font-mono">SKU: {item.sku || 'N/A'}</p>
                             <div className="flex items-center gap-2 mt-1">
                                <p className="text-sm font-black text-gray-900">KSh {item.price}</p>
                                {item.product_sales_pages && item.product_sales_pages.length > 0 && (
                                   <span className="text-[8px] font-black bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded border border-indigo-100 flex items-center gap-1">
                                      ✨ MARKETING READY
                                   </span>
                                )}
                             </div>
                          </div>
                       </div>
                       <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => generateAdLink(item)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg hover:rotate-12 transition-all" title="Get Share Link">
                             🔗
                          </button>
                          {item.product_sales_pages?.[0]?.id && (
                              <button 
                                onClick={() => window.open(`/product/${item.id}`, '_blank')}
                                className="p-2 text-purple-500 hover:bg-purple-50 rounded-lg" 
                                title="View Sales Script"
                              >
                                📄
                              </button>
                           )}
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
           ) : (
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {currentItems.map((item) => (
                     <div key={item.id} className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col transition-all hover:shadow-md ${item.is_active === false ? 'opacity-60' : ''}`}>
                        <div className="aspect-square bg-gray-100 relative group">
                           {item.product_images && item.product_images.length > 0 ? (
                               <img src={item.product_images[0].url} alt="" className="w-full h-full object-cover" />
                           ) : item.image_url ? (
                               <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                           ) : (
                               <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-bold uppercase">No Image</div>
                           )}
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button onClick={() => generateAdLink(item)} className="p-2 bg-white rounded-full text-indigo-600 shadow-sm hover:scale-110 transition-transform">🔗</button>
                              <button onClick={() => startEdit(item)} className="p-2 bg-white rounded-full text-slate-600 shadow-sm hover:scale-110 transition-transform">✏️</button>
                           </div>
                        </div>
                        <div className="p-3 flex-1 flex flex-col">
                           <div className="flex items-start justify-between gap-1 mb-1">
                              <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{item.name}</h3>
                              <button onClick={() => handleToggleActive(item.id, item.is_active)} className="text-xs">{item.is_active === false ? '👁️' : '🚫'}</button>
                           </div>
                           <p className="text-[10px] text-gray-500 mb-2">{item.category}</p>
                           <div className="flex items-center justify-between mt-auto">
                              <p className="font-black text-green-700 text-sm">KSh {item.price}</p>
                              {item.product_sales_pages && item.product_sales_pages.length > 0 && (
                                 <span className="text-[8px] font-black text-indigo-400 bg-indigo-50 px-1 rounded" title="AI Script Generated">✨ AI</span>
                              )}
                           </div>
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
