import { useState, useEffect } from "react";
import { supabase } from "../services/supabase-client";
import { getCurrentUser } from "../services/auth-service";

const PLATFORM_LIBRARY = {
  "🥗 Food & Drink": [
    { key: "benefits", label: "Product Benefits", type: "textarea", placeholder: "e.g. Rich in antioxidants..." },
    { key: "nutrition_info", label: "Nutrition Info", type: "textarea", placeholder: "e.g. 10g Protein, 5g Fiber..." },
    { key: "diet_tags", label: "Diet Tags", type: "tags", placeholder: "e.g. Vegan, Gluten-Free" },
    { key: "ingredients", label: "Ingredients", type: "textarea", placeholder: "List all ingredients..." },
    { key: "origin", label: "Origin", type: "text", placeholder: "e.g. Makueni, Kenya" },
    { key: "processing", label: "Processing", type: "text", placeholder: "e.g. Sun-dried, Cold-pressed" },
    { key: "expiry_date", label: "Expiry Date", type: "date" },
    { key: "recipe", label: "Recipe Suggestions", type: "textarea", placeholder: "How to use this product..." },
    { key: "usage_instructions", label: "Usage Instructions", type: "textarea", placeholder: "e.g. Shake well before use..." }
  ],
  "📦 Retail & Physical": [
    { key: "brand", label: "Brand Name", type: "text", placeholder: "e.g. Nike, Local Artisan" },
    { key: "size", label: "Size/Dimensions", type: "text", placeholder: "e.g. 500ml, 10x10cm" },
    { key: "weight", label: "Weight", type: "text", placeholder: "e.g. 1.5kg" },
    { key: "packaging", label: "Packaging Type", type: "text", placeholder: "e.g. Eco-friendly box" },
    { key: "material", label: "Material", type: "text", placeholder: "e.g. 100% Organic Cotton" },
    { key: "color", label: "Color/Finish", type: "text", placeholder: "e.g. Matte Black" },
    { key: "reorder_level", label: "Reorder Level", type: "number", placeholder: "Low stock alert at..." },
    { key: "bulk_pricing", label: "Bulk Pricing Info", type: "textarea", placeholder: "e.g. 10% off for 10+ units" }
  ],
  "🎨 Craft & Handmade": [
    { key: "made_to_order", label: "Made to Order?", type: "boolean" },
    { key: "production_time", label: "Production Time", type: "text", placeholder: "e.g. 3-5 business days" },
    { key: "care_instructions", label: "Care Instructions", type: "textarea", placeholder: "e.g. Hand wash only..." }
  ],
  "🌐 Digital & Services": [
    { key: "delivery_info", label: "Delivery Method", type: "text", placeholder: "e.g. Instant Email, Download Link" },
    { key: "video_url", label: "Demo Video Link", type: "url", placeholder: "https://youtube.com/..." },
    { key: "license_type", label: "License Type", type: "text", placeholder: "e.g. Personal Use, Commercial" }
  ],
  "🔖 Universal": [
    { key: "promo_info", label: "Promo Description", type: "text", placeholder: "e.g. Buy 1 Get 1 Free!" }
  ]
};

const CATEGORY_SUGGESTIONS = {
  "Main": ["benefits", "brand", "origin"],
  "Sides": ["benefits", "nutrition_info"],
  "Drinks": ["nutrition_info", "diet_tags", "size"],
  "Desserts": ["nutrition_info", "ingredients"],
  "Apparel": ["brand", "size", "material", "color"],
  "Accessories": ["brand", "material"],
  "Primary Collection": ["benefits", "brand", "origin"]
};

export default function AttributePanel({ currentAttributes, onChange, category, shopSchema = [] }) {
  const [showLibrary, setShowLibrary] = useState(false);
  const [activeTab, setActiveTab] = useState(Object.keys(PLATFORM_LIBRARY)[0]);
  const [shopCategoryDefaults, setShopCategoryDefaults] = useState({});

  // Fetch shop-specific category defaults
  useEffect(() => {
    async function fetchShopDefaults() {
      const shopId = getCurrentUser()?.shop_id;
      if (!shopId) return;

      const { data } = await supabase
        .from("shops")
        .select("custom_attributes_schema")
        .eq("shop_id", shopId)
        .single();
      
      if (data?.custom_attributes_schema) {
        if (!Array.isArray(data.custom_attributes_schema) && data.custom_attributes_schema.category_defaults) {
          setShopCategoryDefaults(data.custom_attributes_schema.category_defaults);
        }
      }
    }
    fetchShopDefaults();
  }, []);

  // Handle category-based suggestions when category changes
  useEffect(() => {
    // Priority: 1. Shop-defined defaults, 2. Platform hardcoded defaults, 3. Empty
    const suggestions = shopCategoryDefaults[category] || CATEGORY_SUGGESTIONS[category] || [];
    if (suggestions.length > 0) {
      const newAttrs = { ...currentAttributes };
      let changed = false;
      
      suggestions.forEach(key => {
        if (newAttrs[key] === undefined) {
          // Find field definition to get default value type
          const fieldDef = Object.values(PLATFORM_LIBRARY).flat().find(f => f.key === key) || 
                          shopSchema.find(f => f.key === key);
          
          if (fieldDef) {
            newAttrs[key] = fieldDef.type === 'boolean' || fieldDef.type === 'variation' ? (fieldDef.type === 'boolean' ? false : []) : "";
            changed = true;
          } else {
            // Fallback for unknown keys that might be in the suggestion list
            newAttrs[key] = "";
            changed = true;
          }
        }
      });
      
      if (changed) onChange(newAttrs);
    }
  }, [category, shopCategoryDefaults]);

  const addAttribute = (field) => {
    if (currentAttributes[field.key] !== undefined) return;
    onChange({
      ...currentAttributes,
      [field.key]: field.type === 'boolean' ? false : ""
    });
  };

  const removeAttribute = (key) => {
    const newAttrs = { ...currentAttributes };
    delete newAttrs[key];
    onChange(newAttrs);
  };

  const updateValue = (key, val) => {
    onChange({
      ...currentAttributes,
      [key]: val
    });
  };

  // Find field definition in library or shopSchema
  const getFieldDef = (key) => {
    const platformDef = Object.values(PLATFORM_LIBRARY).flat().find(f => f.key === key);
    if (platformDef) return platformDef;
    
    const shopDef = shopSchema.find(f => f.key === key);
    if (shopDef) return { ...shopDef, type: shopDef.type === 'variation' ? 'text' : shopDef.type };
    
    return { key, label: key.replace(/_/g, ' '), type: 'text' };
  };

  const activeKeys = Object.keys(currentAttributes);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Product Attributes</h3>
          <p className="text-[10px] text-gray-400">Add only the fields relevant to this specific product.</p>
        </div>
        <button 
          type="button"
          onClick={() => setShowLibrary(!showLibrary)}
          className={`text-xs font-bold px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${showLibrary ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-gray-200 hover:border-slate-900'}`}
        >
          {showLibrary ? "Done Selecting" : "+ Add Attribute"}
        </button>
      </div>

      {showLibrary && (
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 animate-in fade-in slide-in-from-top-2">
          <div className="flex overflow-x-auto gap-2 pb-3 mb-4 scrollbar-hide border-b border-slate-200">
            {Object.keys(PLATFORM_LIBRARY).map(group => (
              <button
                key={group}
                type="button"
                onClick={() => setActiveTab(group)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${activeTab === group ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 hover:text-slate-900'}`}
              >
                {group}
              </button>
            ))}
            {shopSchema.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("Custom")}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${activeTab === "Custom" ? 'bg-orange-600 text-white' : 'bg-white text-orange-500 hover:text-orange-900'}`}
              >
                🛠️ Shop Custom
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {activeTab === "Custom" ? (
              shopSchema.map(field => (
                <button
                  key={field.key}
                  type="button"
                  onClick={() => addAttribute(field)}
                  disabled={activeKeys.includes(field.key)}
                  className={`text-left p-3 rounded-xl border text-[10px] font-bold transition-all ${activeKeys.includes(field.key) ? 'bg-white text-gray-300 border-gray-100 cursor-not-allowed' : 'bg-white text-slate-700 border-gray-200 hover:border-orange-500 hover:text-orange-600 shadow-sm'}`}
                >
                  {field.label}
                </button>
              ))
            ) : (
              PLATFORM_LIBRARY[activeTab].map(field => (
                <button
                  key={field.key}
                  type="button"
                  onClick={() => addAttribute(field)}
                  disabled={activeKeys.includes(field.key)}
                  className={`text-left p-3 rounded-xl border text-[10px] font-bold transition-all ${activeKeys.includes(field.key) ? 'bg-white text-gray-300 border-gray-100 cursor-not-allowed' : 'bg-white text-slate-700 border-gray-200 hover:border-slate-900 shadow-sm'}`}
                >
                  {field.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {activeKeys.map(key => {
          const def = getFieldDef(key);
          return (
            <div key={key} className={`relative p-4 rounded-2xl border border-gray-100 bg-white group transition-all hover:border-slate-300 ${def.type === 'textarea' ? 'md:col-span-2' : ''}`}>
              <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{def.label}</label>
                <button 
                  type="button"
                  onClick={() => removeAttribute(key)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs transition-opacity"
                >
                  Remove
                </button>
              </div>

              {def.type === 'textarea' ? (
                <textarea
                  value={currentAttributes[key] || ""}
                  onChange={e => updateValue(key, e.target.value)}
                  placeholder={def.placeholder}
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-slate-900 transition-all"
                  rows={3}
                />
              ) : def.type === 'boolean' ? (
                <div className="flex items-center gap-3 py-2">
                  <button
                    type="button"
                    onClick={() => updateValue(key, !currentAttributes[key])}
                    className={`w-10 h-6 rounded-full transition-all relative ${currentAttributes[key] ? 'bg-green-500' : 'bg-gray-200'}`}
                  >
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all ${currentAttributes[key] ? 'translate-x-4' : ''}`} />
                  </button>
                  <span className="text-xs font-bold text-gray-600">{currentAttributes[key] ? 'Yes' : 'No'}</span>
                </div>
              ) : (
                <input
                  type={def.type || 'text'}
                  value={currentAttributes[key] || ""}
                  onChange={e => updateValue(key, e.target.value)}
                  placeholder={def.placeholder}
                  className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-slate-900 transition-all"
                />
              )}
            </div>
          );
        })}
        {activeKeys.length === 0 && !showLibrary && (
          <div className="md:col-span-2 py-10 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-gray-400">
            <span className="text-2xl mb-2">🏷️</span>
            <p className="text-xs font-medium italic">No extended attributes added yet.</p>
            <button 
              type="button"
              onClick={() => setShowLibrary(true)}
              className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-900 hover:underline"
            >
              Open Attribute Library
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
