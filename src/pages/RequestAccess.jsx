import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase-client";
import PublicLayout from "../components/public/PublicLayout";

export default function RequestAccess() {
  const [formData, setFormData] = useState({
    shop_name: "",
    owner_name: "",
    phone: "",
    email: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const { error: dbError } = await supabase
        .from("onboarding_requests")
        .insert([formData]);

      if (dbError) throw dbError;

      setSuccess(true);
    } catch (err) {
      console.error("Submission error:", err);
      setError("Failed to submit request. Please try again or contact support.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
           <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
           </div>
           <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Received</h2>
           <p className="text-gray-500 mb-8">
             Thank you for your interest in Modern Savannah! Our team will review your details and be in touch on WhatsApp shortly to get you set up.
           </p>
           <Link to="/" className="inline-block bg-gray-900 text-white font-bold px-8 py-3 rounded-xl hover:bg-gray-800 transition">
              Return Home
           </Link>
        </div>
      </div>
    );
  }

  return (
    <PublicLayout hideFooter={true}>
      <div className="flex-grow flex items-center justify-center p-4 py-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-50/50 -z-10"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none -z-10"></div>
        
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
           <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <h1 className="relative text-3xl font-black text-white mb-2 italic tracking-tighter">Get Started</h1>
              <p className="relative text-slate-300 text-sm">Join the waitlist and we'll provision your digital storefront in minutes.</p>
           </div>
           
           <div className="p-8">
             {error && (
               <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
                 {error}
               </div>
             )}

              <form onSubmit={handleSubmit} className="space-y-5">
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Shop/Business Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.shop_name}
                    onChange={(e) => setFormData({...formData, shop_name: e.target.value})}
                    placeholder="e.g. Java House"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition shadow-sm"
                  />
               </div>
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Your Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.owner_name}
                    onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition shadow-sm"
                  />
               </div>
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp Number</label>
                  <input 
                    type="tel" 
                    required 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+254 7XX XXX XXX"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition shadow-sm"
                  />
               </div>
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Email Address <span className="text-slate-400 font-normal">(Optional)</span></label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="hello@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition shadow-sm"
                  />
               </div>

               <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-lg py-4 rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:transform-none mt-4 cursor-pointer"
               >
                 {submitting ? "Sending Request..." : "Request Access"}
               </button>
             </form>
           </div>
        </div>
      </div>
    </PublicLayout>
  );
}
