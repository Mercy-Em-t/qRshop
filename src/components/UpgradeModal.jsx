import { Link } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../services/supabase-client";
import { getCurrentUser } from "../services/auth-service";

export default function UpgradeModal({ featureName, onClose }) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitRequest = async () => {
    const user = getCurrentUser();
    if (!user?.shop_id) return;

    setSubmitting(true);
    const { error } = await supabase.from("upgrade_requests").insert([{
      shop_id: user.shop_id,
      requested_tier: "pro"
    }]);

    if (!error) {
      setSubmitted(true);
    } else {
      console.error("Failed to submit request:", error);
      alert("Error submitting request, please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="bg-gray-900 px-6 py-8 text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full mix-blend-multiply filter blur-2xl opacity-50 animate-blob"></div>
           <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500 rounded-full mix-blend-multiply filter blur-2xl opacity-50 border animate-blob animation-delay-2000"></div>
           
           <div className="relative z-10">
              <span className="text-4xl mb-2 block">🔒</span>
              <h2 className="text-xl font-black text-white">{featureName} is Locked</h2>
              <p className="text-gray-300 text-sm mt-1">This feature requires a Pro Subscription.</p>
           </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <ul className="space-y-3 mb-6">
             <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-green-500 font-bold">✓</span> Unlock Active Marketing Campaigns
             </li>
             <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-green-500 font-bold">✓</span> Access the Ad Generator Studio
             </li>
             <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-green-500 font-bold">✓</span> Direct M-Pesa Checkout Integrations
             </li>
             <li className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-green-500 font-bold">✓</span> Advanced Historical Analytics
             </li>
          </ul>

          <div className="flex flex-col gap-3">
            {!submitted ? (
              <button 
                 onClick={handleSubmitRequest}
                 disabled={submitting}
                 className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl text-center shadow-md hover:bg-indigo-700 transition transform hover:-translate-y-0.5 disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer"
              >
                 {submitting ? "Submitting..." : "📨 Send Upgrade Request"}
              </button>
            ) : (
              <div className="bg-green-50 text-green-700 font-bold py-3 rounded-xl text-center border border-green-100 flex justify-center items-center gap-2">
                 ✅ Request Sent for Approval
              </div>
            )}
            <button 
               onClick={onClose}
               className="w-full bg-gray-100 text-gray-600 font-bold py-3 rounded-xl text-center hover:bg-gray-200 transition cursor-pointer"
            >
               Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
