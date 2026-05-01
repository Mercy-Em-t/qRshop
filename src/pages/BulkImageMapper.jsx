import { useState, useEffect, useCallback, memo, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { getCurrentUser } from "../services/auth-service";
import LoadingSpinner from "../components/LoadingSpinner";

const ImageRow = memo(({ img, products, processing, handleMatchChange, removeImage, cleanName }) => {
  return (
    <tr key={img.id} className="group hover:bg-slate-50/50 transition-colors">
      <td className="px-6 py-4">
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
          <img src={img.preview} alt="" className="w-full h-full object-cover" />
        </div>
      </td>
      <td className="px-6 py-4">
        <p className="text-xs font-bold text-slate-700 truncate max-w-[150px]" title={img.file.name}>
          {img.file.name}
        </p>
        <p className="text-[10px] text-slate-400 font-medium">{(img.file.size / 1024).toFixed(1)} KB</p>
      </td>
      <td className="px-6 py-4">
        <select
          value={img.matchedProductId || ""}
          onChange={(e) => handleMatchChange(img.id, e.target.value)}
          disabled={img.status === "success" || processing}
          className={`w-full text-xs font-bold p-2.5 rounded-xl border-2 transition-all outline-none ${img.matchedProductId === "CREATE_NEW" ? "border-indigo-100 bg-indigo-50/20 text-indigo-700 focus:border-indigo-500" : img.matchedProductId ? "border-green-100 bg-white text-slate-900 focus:border-green-500" : "border-red-50 bg-red-50/30 text-red-400 focus:border-red-200"}`}
        >
          <option value="">-- No Product Matched --</option>
          <optgroup label="Actions">
             <option value="CREATE_NEW">✨ Create as New Product: "{cleanName(img.file.name)}"</option>
          </optgroup>
          <optgroup label="Existing Products">
             {products.map(p => (
               <option key={p.id} value={p.id}>{p.name}</option>
             ))}
          </optgroup>
        </select>
      </td>
      <td className="px-6 py-4 text-center">
        {img.status === "pending" && <span className="text-[10px] font-black text-slate-400 uppercase">Pending</span>}
        {img.status === "uploading" && <span className="text-[10px] font-black text-blue-500 uppercase animate-pulse">Uploading...</span>}
        {img.status === "success" && <span className="text-xl" title="Success">✅</span>}
        {img.status === "error" && (
          <span className="text-[10px] font-black text-red-500 uppercase underline cursor-help" title={img.error}>Error</span>
        )}
      </td>
      <td className="px-6 py-4 text-right">
        <button
          onClick={() => removeImage(img.id)}
          disabled={processing || img.status === "success"}
          className="p-2 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </td>
    </tr>
  );
});

export default function BulkImageMapper() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingImages, setPendingImages] = useState([]);
  const [processing, setProcessing] = useState(false);
  
  const navigate = useNavigate();
  const [user] = useState(() => getCurrentUser());
  const SHOP_ID = user?.shop_id;

  const stats = useMemo(() => ({
    total: pendingImages.length,
    matched: pendingImages.filter(i => i.matchedProductId).length,
    uploaded: pendingImages.filter(i => i.status === "success").length
  }), [pendingImages]);

  const fetchProducts = useCallback(async (isSilent = false) => {
    if (!SHOP_ID) {
      console.warn("BulkMapper: No SHOP_ID found, skipping fetch.");
      setLoading(false);
      return;
    }

    if (!isSilent) setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, image_url, category")
        .eq("shop_id", SHOP_ID)
        .order("name", { ascending: true });

      if (error) throw error;
      if (data) {
        setProducts(data);
      }
    } catch (err) {
      console.error("BulkMapper: Catalog fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [SHOP_ID]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    // Only fetch if we have a shop ID, otherwise handle the error
    if (SHOP_ID) {
      fetchProducts();
    } else {
      setLoading(false);
    }
  }, [user, navigate, fetchProducts, SHOP_ID]);

  const cleanName = useCallback((name) => {
    return name?.toLowerCase()
      .replace(/\.[^/.]+$/, "") // Remove extension
      .replace(/[^a-z0-9]/g, " ") // Replace non-alphanum with space
      .trim();
  }, []);

  const findBestMatch = useCallback((filename, productList) => {
    const cleanedFile = cleanName(filename);
    if (!cleanedFile) return null;

    // Try exact name match
    const exactMatch = productList.find(p => cleanName(p.name) === cleanedFile);
    if (exactMatch) return exactMatch.id;

    // Try partial name match (filename contains product name or vice-versa)
    const partialMatch = productList.find(p => {
      const cleanedProduct = cleanName(p.name);
      return cleanedFile.includes(cleanedProduct) || cleanedProduct.includes(cleanedFile);
    });
    
    return partialMatch ? partialMatch.id : null;
  }, [cleanName]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const newImages = files.map(file => {
      const matchedId = findBestMatch(file.name, products);
      return {
        id: Math.random().toString(36).substring(7),
        file,
        preview: URL.createObjectURL(file),
        matchedProductId: matchedId,
        status: "pending",
        error: null
      };
    });

    setPendingImages(prev => [...prev, ...newImages]);
  };

  const handleMatchChange = useCallback((imageId, productId) => {
    setPendingImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, matchedProductId: productId } : img
    ));
  }, []);

  const removeImage = useCallback((id) => {
    setPendingImages(prev => prev.filter(img => img.id !== id));
  }, []);

  const processImages = async () => {
    const toUpload = pendingImages.filter(img => img.matchedProductId && img.status !== "success");
    if (toUpload.length === 0) {
      alert("No matched images to process. Ensure you have selected a product or 'Create New' for each image.");
      return;
    }

    setProcessing(true);
    let successCount = 0;

    for (const item of toUpload) {
      try {
        setPendingImages(prev => prev.map(img => img.id === item.id ? { ...img, status: "uploading" } : img));

        let productId = item.matchedProductId;
        
        if (productId === "CREATE_NEW") {
           const productFriendlyName = cleanName(item.file.name)
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');

           const { data: newProd, error: prodErr } = await supabase
              .from("menu_items")
              .insert({
                 shop_id: SHOP_ID,
                 name: productFriendlyName || "Unnamed Product",
                 price: 0,
                 is_active: false,
                 category: "Main",
                 description: "Auto-created from bulk image upload."
              })
              .select();
           
           if (prodErr) throw prodErr;
           if (!newProd || newProd.length === 0) throw new Error("Could not create product");
           productId = newProd[0].id;
        }

        const fileExt = item.file.name.split('.').pop();
        const fileName = `${SHOP_ID}/${productId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;

        // 1. Upload to Storage
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, item.file);

        if (uploadError) throw uploadError;

        // 2. Get Public URL
        const { data: publicUrlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);

        const publicUrl = publicUrlData.publicUrl;

        // 3. Update Database sequentially to catch exact errors
        const { error: imgInsertErr } = await supabase.from("product_images").insert({
          product_id: productId,
          url: publicUrl,
          position: 0
        });
        if (imgInsertErr) throw imgInsertErr;

        const { error: itemUpdateErr } = await supabase.from("menu_items").update({ image_url: publicUrl }).eq("id", productId);
        if (itemUpdateErr) throw itemUpdateErr;

        successCount++;
        setPendingImages(prev => prev.map(img => 
          img.id === item.id ? { ...img, status: "success", matchedProductId: productId } : img
        ));
      } catch (err) {
        console.error(`Failed to process ${item.file.name}:`, err);
        let errorMsg = err?.message || err?.error_description || err?.error || "Unknown error during processing";
        if (typeof err === "object" && !err.message) {
          errorMsg = JSON.stringify(err);
        }
        setPendingImages(prev => prev.map(img => 
          img.id === item.id ? { ...img, status: "error", error: errorMsg } : img
        ));
      }
    }

    setProcessing(false);
    alert(`Successfully processed ${successCount} items.`);
    fetchProducts(true); // Silent refresh
  };

  if (loading) return <LoadingSpinner message="Loading Product Catalog..." fullPage={true} />;

  if (!SHOP_ID) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md text-center">
          <div className="text-4xl mb-4">🏪</div>
          <h2 className="text-xl font-black text-slate-900 uppercase">Shop ID Missing</h2>
          <p className="text-sm text-slate-500 mt-2 mb-6">We couldn't determine which shop you're managing. Please select a shop from your dashboard first.</p>
          <Link to="/a" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/a/products" className="text-slate-500 hover:text-slate-900 transition font-bold">← Back</Link>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Bulk Image Mapper</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-3 mr-4">
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Matched</p>
                <p className="text-sm font-bold text-slate-900">{stats.matched} / {stats.total}</p>
              </div>
              <div className="h-8 w-[1px] bg-slate-200"></div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completed</p>
                <p className="text-sm font-bold text-green-600">{stats.uploaded}</p>
              </div>
            </div>
            <button
              disabled={processing || stats.total === 0 || stats.matched === 0}
              onClick={processImages}
              className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition shadow-lg ${processing || stats.total === 0 || stats.matched === 0 ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-green-600 text-white hover:bg-green-700 shadow-green-100"}`}
            >
              {processing ? "Processing..." : "Process All →"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8">
          
          <aside className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-black text-slate-900 mb-2">1. Upload Folder / Files</h2>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                Drop your product images here. Ensure filenames contain parts of the product name for automatic matching.
              </p>
              
              <div className="relative group">
                <div className="border-4 border-dashed border-slate-100 rounded-3xl p-10 flex flex-col items-center justify-center text-center group-hover:border-green-100 transition-colors">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-3xl text-slate-300 group-hover:text-green-500">📥</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700">Drop Images Here</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">JPG, PNG, WEBP (Max 5MB)</p>
                </div>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">How it works</h3>
                 <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                       <span className="bg-green-100 text-green-600 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">1</span>
                       <p className="text-xs text-slate-600 italic">Filenames like <code className="bg-slate-100 px-1 rounded">iphone_15.jpg</code> will auto-match "iPhone 15 Pro".</p>
                    </li>
                    <li className="flex items-start gap-3">
                       <span className="bg-indigo-100 text-indigo-600 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">2</span>
                       <p className="text-xs text-slate-600 italic">If no match is found, select <b>"Create as New Product"</b> to build your catalog automatically.</p>
                    </li>
                    <li className="flex items-start gap-3">
                       <span className="bg-green-100 text-green-600 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">3</span>
                       <p className="text-xs text-slate-600 italic">Click "Process All" to upload and link images to your live catalog.</p>
                    </li>
                 </ul>
              </div>
            </div>
          </aside>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {pendingImages.length === 0 ? (
              <div className="p-20 text-center">
                <div className="text-6xl mb-6 opacity-20 text-slate-400">🖼️</div>
                <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest">No Images Loaded</h3>
                <p className="text-sm text-slate-400 mt-2">Upload some product images to start mapping.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Preview</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Filename</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Detected Product</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {pendingImages.map((img) => (
                      <ImageRow 
                        key={img.id}
                        img={img}
                        products={products}
                        processing={processing}
                        handleMatchChange={handleMatchChange}
                        removeImage={removeImage}
                        cleanName={cleanName}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
