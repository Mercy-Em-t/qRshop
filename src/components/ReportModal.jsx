import { useState } from "react";
import { supabase } from "../services/supabase-client";

export default function ReportModal({ shop, onClose }) {
  const [category, setCategory] = useState("fake_product");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    const { error } = await supabase.from("shop_reports").insert({
      shop_id: shop.id,
      agent_id: shop.agent_id,
      category,
      description
    });

    if (!error) {
      setSuccess(true);
      setTimeout(onClose, 2000);
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
       <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
          {success ? (
             <div className="text-center py-10">
                <span className="text-5xl mb-4 block">✅</span>
                <h3 className="text-2xl font-black text-slate-900">Report Submitted</h3>
                <p className="text-slate-500 mt-2 font-medium">Your report was successfully routed to the regional agent for investigation.</p>
             </div>
          ) : (
             <>
                <div className="flex justify-between items-start mb-6">
                   <div>
                      <h3 className="text-2xl font-black text-slate-900">Report Merchant</h3>
                      <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">Accountability Protocol 🛡️</p>
                   </div>
                   <button onClick={onClose} className="text-slate-300 hover:text-slate-500 transition">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                   </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                   <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Reason for Report</label>
                      <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 rounded-2xl py-3 px-4 outline-none transition font-bold text-slate-700"
                      >
                         <option value="fake_product">Counterfeit/Fake Product</option>
                         <option value="non_delivery">Item Never Delivered</option>
                         <option value="scam">Potential Hub/Delivery Scam</option>
                         <option value="inaccurate_price">Inaccurate Price (Hidden Costs)</option>
                         <option value="inappropriate">Inappropriate Content</option>
                      </select>
                   </div>

                   <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Describe the Issue</label>
                      <textarea 
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Please provide specific details..."
                        className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 rounded-2xl py-4 px-4 outline-none transition font-medium text-slate-700 h-32 resize-none"
                      />
                   </div>

                   <button 
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-red-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-red-100 hover:bg-red-600 transition tracking-tight disabled:opacity-50"
                   >
                      {submitting ? "Submitting..." : "Send Report to Agent"}
                   </button>
                </form>
             </>
          )}
       </div>
    </div>
  );
}
