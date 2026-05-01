import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { getCurrentUser } from "../services/auth-service";

const PLATFORM_DEFAULTS = [
  { key: "benefits", label: "Product Benefits" },
  { key: "nutrition_info", label: "Nutrition Info" },
  { key: "diet_tags", label: "Diet Tags" },
  { key: "ingredients", label: "Ingredients" },
  { key: "origin", label: "Origin" },
  { key: "processing", label: "Processing" },
  { key: "expiry_date", label: "Expiry Date" },
  { key: "recipe", label: "Recipe Suggestions" },
  { key: "usage_instructions", label: "Usage Instructions" },
  { key: "brand", label: "Brand Name" },
  { key: "size", label: "Size/Dimensions" },
  { key: "weight", label: "Weight" },
  { key: "packaging", label: "Packaging Type" },
  { key: "material", label: "Material" },
  { key: "color", label: "Color/Finish" },
  { key: "made_to_order", label: "Made to Order?" },
  { key: "production_time", label: "Production Time" },
  { key: "care_instructions", label: "Care Instructions" },
  { key: "delivery_info", label: "Delivery Method" },
  { key: "video_url", label: "Demo Video Link" },
  { key: "license_type", label: "License Type" },
  { key: "promo_info", label: "Promo Description" }
];

export default function ManageAttributes() {
  const [fields, setFields] = useState([]);
  const [categoryDefaults, setCategoryDefaults] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("attributes"); // 'attributes' or 'categories'
  const [newLabel, setNewLabel] = useState("");
  const [newCategory, setNewCategory] = useState("");
  
  const navigate = useNavigate();
  const shopId = getCurrentUser()?.shop_id;

  useEffect(() => {
    async function fetchShopSettings() {
      if (!shopId) return;
      const { data } = await supabase
        .from("shops")
        .select("*")
        .eq("shop_id", shopId)
        .single();
      
      if (data) {
        if (data.custom_attributes_schema) setFields(data.custom_attributes_schema);
        if (data.category_attribute_defaults) setCategoryDefaults(data.category_attribute_defaults);
      }
      setLoading(false);
    }
    fetchShopSettings();
  }, [shopId]);

  const PRESETS = [
    { label: "📦 Size", key: "size", type: "variation" },
    { label: "⚖️ Weight", key: "weight", type: "variation" },
    { label: "🎨 Color", key: "color", type: "variation" },
    { label: "🪵 Material", key: "material", type: "text" },
    { label: "🍇 Flavor", key: "flavor", type: "variation" },
    { label: "📅 Vintage/Year", key: "vintage", type: "text" },
  ];

  const handleAddPreset = (preset) => {
    if (fields.some(f => f.key === preset.key)) return;
    setFields([...fields, { ...preset }]);
  };

  const handleAddField = () => {
    if (!newLabel.trim()) return;
    const key = newLabel.toLowerCase().replace(/[^a-z0-9]/g, "_");
    if (fields.some(f => f.key === key)) {
      alert("This attribute already exists!");
      return;
    }
    setFields([...fields, { label: newLabel, key, type: "text" }]);
    setNewLabel("");
  };

  const handleRemoveField = (key) => {
    setFields(fields.filter(f => f.key !== key));
  };

  const toggleCategoryAttribute = (cat, attrKey) => {
    const current = categoryDefaults[cat] || [];
    let updated;
    if (current.includes(attrKey)) {
      updated = current.filter(k => k !== attrKey);
    } else {
      updated = [...current, attrKey];
    }
    setCategoryDefaults({ ...categoryDefaults, [cat]: updated });
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    if (categoryDefaults[newCategory]) {
      alert("This category is already configured!");
      return;
    }
    setCategoryDefaults({ ...categoryDefaults, [newCategory]: [] });
    setNewCategory("");
  };

  const handleRemoveCategory = (cat) => {
    const updated = { ...categoryDefaults };
    delete updated[cat];
    setCategoryDefaults(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("shops")
        .update({ 
          custom_attributes_schema: fields,
          category_attribute_defaults: categoryDefaults
        })
        .eq("shop_id", shopId);
      
      if (error) throw error;
      alert("Settings saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save settings. Check your database connection.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  const allAvailableAttributes = [
    ...PLATFORM_DEFAULTS,
    ...fields.map(f => ({ key: f.key, label: f.label + " (Shop Custom)" }))
  ];

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-3xl shadow-sm mt-8 border border-gray-100">
      <div className="flex justify-between items-center mb-8">
         <div>
            <h1 className="text-2xl font-black text-gray-900">Experience Manager</h1>
            <p className="text-gray-500 text-sm italic">Optimize how you create and display products</p>
         </div>
         <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 bg-gray-50 p-2 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
         </button>
      </div>

      <div className="flex gap-4 mb-8 bg-gray-50 p-1.5 rounded-2xl">
        <button 
          onClick={() => setActiveTab("attributes")}
          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'attributes' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
        >
          1. Custom Fields
        </button>
        <button 
          onClick={() => setActiveTab("categories")}
          className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'categories' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
        >
          2. Category Suggestions
        </button>
      </div>

      {activeTab === "attributes" ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-left-4">
          <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50">
             <h3 className="text-xs font-black uppercase tracking-widest text-blue-600 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                Standard Presets
             </h3>
             <div className="flex flex-wrap gap-2">
                {PRESETS.map(p => (
                  <button
                    key={p.key}
                    disabled={fields.some(f => f.key === p.key)}
                    onClick={() => handleAddPreset(p)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all ${
                      fields.some(f => f.key === p.key) 
                      ? "bg-white text-gray-300 border border-gray-100 cursor-not-allowed" 
                      : "bg-white text-gray-700 border border-gray-200 hover:border-blue-500 hover:text-blue-600 shadow-sm"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
             </div>
          </div>

          <div className="space-y-4">
             <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 px-1">Define New Field</h3>
             <div className="flex gap-3">
               <input 
                 type="text"
                 value={newLabel}
                 onChange={(e) => setNewLabel(e.target.value)}
                 placeholder="e.g. Dimensions, Origin..."
                 className="flex-1 bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-slate-900 transition-all font-medium"
               />
               <button 
                 onClick={handleAddField}
                 className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:shadow-lg transition-all"
               >
                 Add
               </button>
             </div>
          </div>

          <div className="grid gap-3">
            {fields.map((field) => (
              <div key={field.key} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:border-slate-300 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-xl ${field.type === 'variation' ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-400'}`}>
                    {field.type === 'variation' ? (
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    ) : (
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" /></svg>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 flex items-center gap-2">
                      {field.label}
                      {field.type === 'variation' && <span className="bg-orange-600 text-white text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Umbrella Item</span>}
                    </p>
                    <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">{field.key}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleRemoveField(field.key)}
                  className="text-red-300 hover:text-red-600 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
            {fields.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-3xl">
                <p className="text-gray-400 font-medium italic">No custom fields defined yet.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
           <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50">
             <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600 mb-4">Configure New Category</h3>
             <div className="flex gap-3">
               <input 
                 type="text"
                 value={newCategory}
                 onChange={(e) => setNewCategory(e.target.value)}
                 placeholder="e.g. Organic Produce, Handmade Bags..."
                 className="flex-1 bg-white border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
               />
               <button 
                 onClick={handleAddCategory}
                 className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:shadow-lg transition-all text-xs"
               >
                 Add Category
               </button>
             </div>
          </div>

          <div className="space-y-6">
            {Object.keys(categoryDefaults).map(cat => (
              <div key={cat} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b border-gray-100">
                  <h4 className="font-black text-slate-800 uppercase tracking-widest text-xs">{cat}</h4>
                  <button onClick={() => handleRemoveCategory(cat)} className="text-red-300 hover:text-red-500 text-xs font-bold uppercase tracking-tighter">Delete Map</button>
                </div>
                <div className="p-6">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Suggest these attributes:</p>
                  <div className="flex flex-wrap gap-2">
                    {allAvailableAttributes.map(attr => (
                      <button
                        key={attr.key}
                        onClick={() => toggleCategoryAttribute(cat, attr.key)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all border ${categoryDefaults[cat]?.includes(attr.key) ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-400'}`}
                      >
                        {attr.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {Object.keys(categoryDefaults).length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-3xl">
                <p className="text-gray-400 font-medium italic">No category mappings defined yet.</p>
                <p className="text-[10px] text-gray-300 mt-1 uppercase tracking-widest">Define categories to auto-suggest attributes in Product Manager</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="pt-8 border-t border-gray-100 flex justify-end gap-3 mt-8">
        <button 
          onClick={() => navigate(-1)}
          className="px-8 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-all"
        >
          Cancel
        </button>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-bold hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? "Saving..." : "Save Configuration"}
        </button>
      </div>
    </div>
  );
}

