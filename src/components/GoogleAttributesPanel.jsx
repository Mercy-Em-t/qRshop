import React from 'react';
import GoogleCategoryPicker from './GoogleCategoryPicker';

export default function GoogleAttributesPanel({ 
  customFields, 
  setCustomFields, 
  sku 
}) {
  const gCatId = customFields.google_product_category_id || null;
  const condition = customFields.condition || "new";
  const gtin = customFields.gtin || "";
  const shippingWeight = customFields.shipping_weight || "";
  
  // Try to extract number and unit if it exists (e.g. "0.500 kg")
  let weightNum = "";
  let weightUnit = "kg";
  if (shippingWeight) {
    const parts = shippingWeight.trim().split(" ");
    if (parts.length >= 1) weightNum = parts[0];
    if (parts.length >= 2) weightUnit = parts[1].toLowerCase();
  }

  const handleCategoryChange = (id, path) => {
    setCustomFields(prev => {
      const copy = { ...prev };
      if (id) {
        copy.google_product_category_id = id;
        copy.google_product_category = path;
      } else {
        delete copy.google_product_category_id;
        delete copy.google_product_category;
      }
      return copy;
    });
  };

  const handleWeightChange = (num, unit) => {
    setCustomFields(prev => ({
      ...prev,
      shipping_weight: num ? `${num} ${unit}` : ""
    }));
  };

  return (
    <div className="space-y-4">
      
      {/* Category Picker */}
      <div>
        <p className="text-xs font-bold text-gray-700 mb-2">Google Product Category</p>
        <p className="text-[10px] text-gray-500 mb-3">Choose the most specific category for this product to ensure it appears in relevant Google Shopping searches.</p>
        <GoogleCategoryPicker 
          value={gCatId} 
          onChange={handleCategoryChange} 
        />
      </div>

      <div className="border-t border-gray-100 my-4"></div>

      {/* Other Attributes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Shipping Weight */}
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            Shipping Weight <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input 
              type="number" 
              step="0.01"
              min="0"
              placeholder="e.g. 0.5"
              value={weightNum}
              onChange={(e) => handleWeightChange(e.target.value, weightUnit)}
              className="flex-1 bg-white border border-gray-200 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 transition"
              required
            />
            <select
              value={weightUnit}
              onChange={(e) => handleWeightChange(weightNum, e.target.value)}
              className="w-20 bg-gray-50 border border-gray-200 text-sm px-2 py-2 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="lb">lb</option>
              <option value="oz">oz</option>
            </select>
          </div>
          <p className="text-[9px] text-gray-400 mt-1">Required by Google for accurate shipping cost calculation.</p>
        </div>

        {/* Condition */}
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Condition</label>
          <select 
            value={condition}
            onChange={(e) => setCustomFields({...customFields, condition: e.target.value})}
            className="w-full bg-white border border-gray-200 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 transition"
          >
            <option value="new">New</option>
            <option value="refurbished">Refurbished</option>
            <option value="used">Used</option>
          </select>
        </div>

        {/* GTIN */}
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">GTIN / Barcode</label>
          <input 
            type="text" 
            placeholder="e.g. 0614141007349"
            value={gtin}
            onChange={(e) => setCustomFields({...customFields, gtin: e.target.value})}
            className="w-full bg-white border border-gray-200 text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 transition font-mono"
          />
          <p className="text-[9px] text-gray-400 mt-1">Optional. Global Trade Item Number (UPC, EAN, JAN, ISBN).</p>
        </div>

        {/* MPN Preview */}
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">MPN</label>
          <input 
            type="text" 
            value={sku || "N/A"}
            disabled
            className="w-full bg-gray-50 border border-gray-200 text-sm px-3 py-2 rounded-lg text-gray-500 font-mono"
          />
          <p className="text-[9px] text-gray-400 mt-1">Manufacturer Part Number automatically uses your SKU.</p>
        </div>

      </div>

    </div>
  );
}
