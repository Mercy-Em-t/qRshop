import { useState, useEffect } from "react";
import { supabase } from "../services/supabase-client";

export default function ProductGalleryManager({ productId, shopId, currentMainImage, onMainImageChange }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (productId) {
      fetchImages();
    }
  }, [productId]);

  const fetchImages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("product_images")
      .select("*")
      .eq("product_id", productId)
      .order("position", { ascending: true });
    
    if (error) {
      console.error("Failed to fetch gallery images:", error);
    } else {
      setImages(data || []);
    }
    setLoading(false);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${shopId}/${productId}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);
        
      if (uploadError) throw uploadError;
      
      const { data: publicUrlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);
        
      const imageUrl = publicUrlData.publicUrl;
      
      // Save to product_images
      const { error: dbError } = await supabase.from("product_images").insert({
          product_id: productId,
          url: imageUrl,
          position: images.length
      });

      if (dbError) throw dbError;

      // Automatically set as main if it's the first image
      if (!currentMainImage && images.length === 0) {
         await setAsMain(imageUrl);
      } else {
         fetchImages();
      }
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed.");
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  const setAsMain = async (url) => {
    try {
      const { error } = await supabase
        .from("menu_items")
        .update({ image_url: url })
        .eq("id", productId);
        
      if (error) throw error;
      onMainImageChange(url);
    } catch (err) {
      console.error("Failed to set main image:", err);
      alert("Failed to set main image");
    }
  };

  const handleDelete = async (imageId, url) => {
    if (!window.confirm("Delete this image?")) return;
    
    try {
      await supabase.from("product_images").delete().eq("id", imageId);
      
      // We could also delete from storage bucket here, but let's just detach it for safety/speed
      
      setImages(images.filter(img => img.id !== imageId));
      
      // If deleted image was the main one, reset main to first available or null
      if (currentMainImage === url) {
         const nextImg = images.find(img => img.id !== imageId);
         await setAsMain(nextImg ? nextImg.url : null);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (loading) return <div className="text-sm text-gray-500">Loading gallery...</div>;

  return (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800 text-sm">Product Gallery</h3>
        <label className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition ${uploading ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100 cursor-pointer'}`}>
          {uploading ? 'Uploading...' : '+ Add Image'}
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
        </label>
      </div>

      {images.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-4">No gallery images yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map(img => {
            const isMain = currentMainImage === img.url;
            return (
              <div key={img.id} className={`relative group rounded-lg overflow-hidden border-2 transition ${isMain ? 'border-green-500 shadow-sm' : 'border-transparent'}`}>
                <div className="aspect-square bg-gray-100">
                  <img src={img.url} className="w-full h-full object-cover" alt="Product variation" />
                </div>
                
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2">
                  {!isMain && (
                    <button 
                      type="button"
                      onClick={() => setAsMain(img.url)}
                      className="text-[10px] font-bold bg-white text-gray-900 px-2 py-1 rounded shadow-sm hover:scale-105"
                    >
                      Set Main
                    </button>
                  )}
                  <button 
                    type="button"
                    onClick={() => handleDelete(img.id, img.url)}
                    className="text-[10px] font-bold bg-red-500 text-white px-2 py-1 rounded shadow-sm hover:scale-105"
                  >
                    Delete
                  </button>
                </div>
                
                {isMain && (
                  <span className="absolute top-1 left-1 bg-green-500 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm">Main</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
