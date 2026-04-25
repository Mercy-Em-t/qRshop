import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import { getCurrentUser } from "../services/auth-service";

export default function ManageAttributes() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const navigate = useNavigate();
  const shopId = getCurrentUser()?.shop_id;

  useEffect(() => {
    async function fetchSchema() {
      if (!shopId) return;
      const { data } = await supabase
        .from("shops")
        .select("custom_attributes_schema")
        .eq("shop_id", shopId)
        .single();
      
      if (data?.custom_attributes_schema) {
        setFields(data.custom_attributes_schema);
      }
      setLoading(false);
    }
    fetchSchema();
  }, [shopId]);

  const handleAddField = () => {
    if (!newLabel.trim()) return;
    const key = newLabel.toLowerCase().replace(/[^a-z0-9]/g, "_");
    if (fields.some(f => f.key === key)) {
      alert("This attribute already exists!");
      return;
    }
    setFields([...fields, { label: newLabel, key }]);
    setNewLabel("");
  };

  const handleRemoveField = (key) => {
    setFields(fields.filter(f => f.key !== key));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("shops")
        .update({ custom_attributes_schema: fields })
        .eq("shop_id", shopId);
      
      if (error) throw error;
      alert("Settings saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save. Ensure the 'custom_attributes_schema' column exists in your shops table.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-3xl shadow-sm mt-8">
      <div className="flex justify-between items-center mb-8">
         <div>
            <h1 className="text-2xl font-black text-gray-900">Attributes Manager</h1>
            <p className="text-gray-500 text-sm">Define custom fields for your products</p>
         </div>
         <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
         </button>
      </div>

      <div className="space-y-6">
        <div className="flex gap-3">
          <input 
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="e.g. Vintage, ISBN, Weight"
            className="flex-1 bg-gray-50 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-theme-main transition-all font-medium"
          />
          <button 
            onClick={handleAddField}
            className="bg-theme-main text-white px-8 py-4 rounded-2xl font-bold hover:shadow-lg transition-all"
          >
            Add Field
          </button>
        </div>

        <div className="grid gap-3">
          {fields.map((field) => (
            <div key={field.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div>
                <p className="font-bold text-gray-800">{field.label}</p>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">{field.key}</p>
              </div>
              <button 
                onClick={() => handleRemoveField(field.key)}
                className="text-red-400 hover:text-red-600 p-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          ))}
          {fields.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-3xl">
              <p className="text-gray-400 font-medium italic">No custom attributes defined yet.</p>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-gray-100 flex justify-end gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="px-8 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 transition-all font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-bold hover:shadow-xl transition-all disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}
