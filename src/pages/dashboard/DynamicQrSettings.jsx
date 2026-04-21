import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase-client";

export default function DynamicQrSettings() {
  const { qrId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    opens_at: "",
    closes_at: "",
    closed_message: ""
  });

  useEffect(() => {
    async function fetchSettings() {
      if (!qrId || qrId === "undefined") return;
      const { data, error } = await supabase
        .from("qrs")
        .select("*")
        .eq("qr_id", qrId)
        .single();
        
      if (error) {
        console.error("Failed to fetch node:", error);
      } else if (data) {
        setFormData({
          opens_at: data.opens_at || "",
          closes_at: data.closes_at || "",
          closed_message: data.closed_message || ""
        });
      }
      setLoading(false);
    }
    init();
  }, [qrId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    // Convert empty strings to null for DB cleanly
    const payload = {
      opens_at: formData.opens_at || null,
      closes_at: formData.closes_at || null,
      closed_message: formData.closed_message || null
    };

    const { error } = await supabase
      .from("qrs")
      .update(payload)
      .eq("qr_id", qrId);

    setSaving(false);
    if (error) {
      alert("Error saving settings: " + error.message);
    } else {
      navigate("/dashboard/qrs");
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Loading node settings...</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
         <Link to="/dashboard/qrs" className="text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-2">
            ← Back to Fleet
         </Link>
         <h1 className="text-2xl font-bold tracking-tight">Node <span className="font-mono text-blue-600 bg-blue-50 px-2 rounded-md">{qrId}</span> Settings</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
         <div className="mb-6 pb-6 border-b border-gray-100">
           <h2 className="text-lg font-bold text-gray-800 mb-2">Dynamic Routing (Time-Based)</h2>
           <p className="text-sm text-gray-500">If configured, scanning this QR code outside of operating hours will block access and show your custom message.</p>
         </div>

         <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1.5">Opens At</label>
                 <input 
                   type="time" 
                   value={formData.opens_at}
                   onChange={e => setFormData({...formData, opens_at: e.target.value})}
                   className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                 />
                 <p className="text-xs text-gray-400 mt-1">Leave blank for always open</p>
              </div>
              <div>
                 <label className="block text-sm font-bold text-gray-700 mb-1.5">Closes At</label>
                 <input 
                   type="time" 
                   value={formData.closes_at}
                   onChange={e => setFormData({...formData, closes_at: e.target.value})}
                   className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                 />
                 <p className="text-xs text-gray-400 mt-1">Leave blank for always open</p>
              </div>
            </div>

            <div>
               <label className="block text-sm font-bold text-gray-700 mb-1.5">Closed Message</label>
               <textarea
                 rows={3}
                 value={formData.closed_message}
                 onChange={e => setFormData({...formData, closed_message: e.target.value})}
                 placeholder="Sorry, we are currently closed! We open at 8:00 AM."
                 className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
               />
               <p className="text-xs text-gray-400 mt-1">Displayed to customers who scan outside hours.</p>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
               <button 
                 type="button" 
                 onClick={() => navigate("/dashboard/qrs")}
                 className="px-6 py-2.5 rounded-xl font-bold bg-gray-50 text-gray-600 hover:bg-gray-100 transition text-sm"
               >
                 Cancel
               </button>
               <button 
                 type="submit" 
                 disabled={saving}
                 className="px-6 py-2.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 text-sm"
               >
                 {saving ? "Saving..." : "Save Route Config"}
               </button>
            </div>
         </form>
      </div>
    </div>
  );
}
