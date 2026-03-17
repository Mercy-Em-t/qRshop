import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase-client";

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
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
           <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
           </div>
           <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Received</h2>
           <p className="text-gray-500 mb-8">
             Thank you for your interest in ShopQR! Our team will review your details and be in touch on WhatsApp shortly to get you set up.
           </p>
           <Link to="/" className="inline-block bg-gray-900 text-white font-bold px-8 py-3 rounded-xl hover:bg-gray-800 transition">
              Return Home
           </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 cursor-pointer">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-green-600" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z" clipRule="evenodd" />
               <path d="M11 4a1 1 0 10-2 0v1a1 1 0 002 0V4zM10 7a1 1 0 011 1v1h2a1 1 0 110 2h-3a1 1 0 01-1-1V8a1 1 0 011-1zM16 9a1 1 0 100 2 1 1 0 000-2zM9 13a1 1 0 011-1h1a1 1 0 110 2v2a1 1 0 11-2 0v-3zM7 11a1 1 0 100-2H4a1 1 0 100 2h3zM17 13a1 1 0 10-2 0v1h-1a1 1 0 100 2h2a1 1 0 001-1v-2z" />
             </svg>
             <span className="font-bold text-xl tracking-tight text-gray-900">Savannah</span>
          </Link>
          <Link to="/login" className="text-gray-600 font-medium hover:text-green-600 transition">Log In</Link>
        </div>
      </nav>

      <div className="flex-grow flex items-center justify-center p-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
           <div className="bg-gray-900 p-8 text-center">
              <h1 className="text-2xl font-bold text-white mb-2">Get Started</h1>
              <p className="text-gray-400 text-sm">Join the waitlist and we'll provision your digital storefront in minutes.</p>
           </div>
           
           <div className="p-8">
             {error && (
               <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
                 {error}
               </div>
             )}

             <form onSubmit={handleSubmit} className="space-y-5">
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Shop/Business Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.shop_name}
                    onChange={(e) => setFormData({...formData, shop_name: e.target.value})}
                    placeholder="e.g. Java House"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition"
                  />
               </div>
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Your Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.owner_name}
                    onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                    placeholder="e.g. John Doe"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition"
                  />
               </div>
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">WhatsApp Number</label>
                  <input 
                    type="tel" 
                    required 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+254 7XX XXX XXX"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition"
                  />
               </div>
               <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email Address <span className="text-gray-400 font-normal">(Optional)</span></label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="hello@example.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition"
                  />
               </div>

               <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full bg-green-600 text-white font-bold text-lg py-4 rounded-xl hover:bg-green-700 transition shadow-md disabled:opacity-50 mt-4 cursor-pointer"
               >
                 {submitting ? "Sending Request..." : "Request Access"}
               </button>
             </form>
           </div>
        </div>
      </div>
    </div>
  );
}
