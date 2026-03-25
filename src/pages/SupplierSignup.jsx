import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase-client";

export default function SupplierSignup() {
  const [formData, setFormData] = useState({
    name: "",
    industry: "retail",
    contact_phone: "",
    website: "",
    mpesa_shortcode: ""
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('suppliers').insert([{
      ...formData,
      is_verified: false // Requires admin approval
    }]);

    if (!error) {
      setSubmitted(true);
    } else {
      alert("Error: " + error.message);
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mb-6">✓</div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Application Received!</h1>
        <p className="text-gray-500 max-w-sm mb-8">Our team will review your wholesaler profile and reach out within 24 hours to finalize your onboarding.</p>
        <Link to="/" className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-black transition">Return to Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4">
      <Link to="/" className="text-gray-400 hover:text-gray-600 font-bold mb-8">← Back to Savannah</Link>
      
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
        <h1 className="text-2xl font-black text-gray-900 mb-2">Become a Supplier</h1>
        <p className="text-gray-500 mb-8 text-sm">Join our B2B network and start selling wholesale to hundreds of local shops.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Company Name</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="e.g. Acme Wholesale Ltd"
              className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-400 rounded-xl px-4 py-3 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Industry</label>
            <select 
              value={formData.industry}
              onChange={e => setFormData({...formData, industry: e.target.value})}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-400 rounded-xl px-4 py-3 outline-none transition"
            >
              <option value="retail">Retail & Fast Moving Goods</option>
              <option value="electronics">Electronics & Tech</option>
              <option value="food">Food & Beverage (Bulk)</option>
              <option value="services">Professional Services</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Contact Phone</label>
            <input 
              required
              type="tel" 
              value={formData.contact_phone}
              onChange={e => setFormData({...formData, contact_phone: e.target.value})}
              placeholder="e.g. 254712345678"
              className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-400 rounded-xl px-4 py-3 outline-none transition"
            />
          </div>

          <div className="pt-4 border-t border-gray-50">
            <h3 className="text-sm font-bold text-gray-800 mb-3">M-Pesa Payout Details (Optional)</h3>
            <div className="grid grid-cols-1 gap-3">
              <input 
                type="text" 
                placeholder="Paybill/Till Number (optional)"
                value={formData.mpesa_shortcode}
                onChange={e => setFormData({...formData, mpesa_shortcode: e.target.value})}
                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-400 rounded-xl px-4 py-2 text-sm outline-none transition"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-2 italic">Your Daraja Passkey will be collected securely after admin verification — never on a public form.</p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 mt-6"
          >
            {loading ? "Submitting..." : "Apply to Join"}
          </button>
        </form>
      </div>
    </div>
  );
}
