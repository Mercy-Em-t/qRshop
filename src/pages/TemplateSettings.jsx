import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { getCurrentUser } from "../services/auth-service";
import { fetchTemplates, createTemplate, deleteTemplate } from "../services/template-service";

export default function TemplateSettings() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newFields, setNewFields] = useState([
    { label: "Origin", field_type: "text", is_required: false },
    { label: "Usage", field_type: "textarea", is_required: false }
  ]);

  const navigate = useNavigate();
  const user = getCurrentUser();
  const SHOP_ID = user?.shop_id;

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await fetchTemplates(SHOP_ID);
      setTemplates(data);
    } catch (err) {
      console.error("Failed to load templates:", err);
    }
    setLoading(false);
  };

  const addField = () => {
    setNewFields([...newFields, { label: "", field_type: "text", is_required: false }]);
  };

  const removeField = (index) => {
    setNewFields(newFields.filter((_, i) => i !== index));
  };

  const updateField = (index, key, value) => {
    const updated = [...newFields];
    updated[index][key] = value;
    setNewFields(updated);
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!newName) return;

    try {
      await createTemplate(SHOP_ID, newName, newDesc, newFields);
      setNewName("");
      setNewDesc("");
      setNewFields([{ label: "Origin", field_type: "text", is_required: false }]);
      setIsAdding(false);
      loadTemplates();
    } catch (err) {
      alert("Failed to create template: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure? Products using this template will lose their custom field definitions.")) return;
    try {
      await deleteTemplate(id);
      loadTemplates();
    } catch (err) {
      alert("Error deleting: " + err.message);
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse text-indigo-600 font-bold uppercase tracking-widest">Loading Blueprints...</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
           <div>
              <h1 className="text-xl font-bold text-gray-900">Product Templates</h1>
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Define your shop's data model</p>
           </div>
           <button 
              onClick={() => setIsAdding(!isAdding)}
              className="bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-full hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20"
           >
              {isAdding ? "Cancel" : "+ New Blueprint"}
           </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        
        {isAdding && (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-2xl mb-8 animate-in slide-in-from-top duration-300">
             <h2 className="text-lg font-black text-gray-900 mb-6 uppercase tracking-tight">Create Template</h2>
             <form onSubmit={handleSaveTemplate} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                   <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Template Name</label>
                      <input 
                         type="text" value={newName} onChange={e => setNewName(e.target.value)}
                         placeholder="e.g. Organic Grains" required
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-600 outline-none transition font-bold"
                      />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Description</label>
                      <input 
                         type="text" value={newDesc} onChange={e => setNewDesc(e.target.value)}
                         placeholder="Custom fields for our harvest products"
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-600 outline-none transition"
                      />
                   </div>
                </div>

                <div className="space-y-3">
                   <div className="flex items-center justify-between border-b pb-2">
                       <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Custom Fields</h3>
                       <button type="button" onClick={addField} className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase">+ Add Field</button>
                   </div>
                   
                   {newFields.map((field, index) => (
                      <div key={index} className="flex gap-4 items-end bg-slate-50 p-4 rounded-2xl border border-slate-100 group">
                         <div className="flex-1">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Field Label</label>
                            <input 
                               type="text" value={field.label} 
                               onChange={e => updateField(index, "label", e.target.value)}
                               placeholder="e.g. Origin"
                               className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold"
                            />
                         </div>
                         <div className="w-32">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Type</label>
                            <select 
                               value={field.field_type} 
                               onChange={e => updateField(index, "field_type", e.target.value)}
                               className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs"
                            >
                               <option value="text">Text</option>
                               <option value="number">Number</option>
                               <option value="textarea">Long Text</option>
                               <option value="checkbox">Toggle</option>
                            </select>
                         </div>
                         <button 
                            type="button" onClick={() => removeField(index)}
                            className="p-2.5 text-red-400 hover:bg-red-50 rounded-lg transition"
                         >
                            🗑️
                         </button>
                      </div>
                   ))}
                </div>

                <div className="pt-4 flex justify-end gap-3">
                   <button 
                      type="submit"
                      className="bg-indigo-600 text-white font-black py-4 px-12 rounded-2xl hover:bg-indigo-700 transition shadow-xl"
                   >
                      ACTIVATE TEMPLATE
                   </button>
                </div>
             </form>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
           {templates.map(t => (
              <div key={t.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => handleDelete(t.id)} className="text-red-400 hover:text-red-600">Delete</button>
                 </div>
                 <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-xl mb-4">
                    ✨
                 </div>
                 <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition tracking-tight">{t.name}</h3>
                 <p className="text-xs text-slate-400 mb-4 h-8 overflow-hidden">{t.description || "No description provided."}</p>
                 
                 <div className="space-y-2 border-t pt-4">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Fields</p>
                    {t.product_template_fields?.map(f => (
                       <div key={f.id} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                          <span className="text-[10px] font-bold text-slate-600 uppercase">{f.label}</span>
                          <span className="text-[9px] text-slate-400 italic">({f.field_type})</span>
                       </div>
                    ))}
                 </div>

                 <button 
                  onClick={() => navigate('/product-manager', { state: { selectedTemplate: t.id } })}
                  className="w-full mt-6 py-3 rounded-xl border border-indigo-100 text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-50 transition"
                 >
                    Use in Catalog
                 </button>
              </div>
           ))}
        </div>

        {templates.length === 0 && !isAdding && (
           <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">No Templates Found</p>
              <button 
                onClick={() => setIsAdding(true)}
                className="text-indigo-600 font-black uppercase text-[10px] tracking-widest"
              >
                + Create your first product blueprint
              </button>
           </div>
        )}

      </main>
    </div>
  );
}
