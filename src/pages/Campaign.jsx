import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { getQrSession } from "../utils/qr-session";

export default function Campaign() {
  const session = getQrSession();
  const navigate = useNavigate();

  const handleClaim = () => {
    try {
      localStorage.setItem("qr_saved_coupon", JSON.stringify({
        code: "WELCOME20",
        discountPercentage: 20,
        description: "20% Off Your First Order!"
      }));
    } catch {}
    navigate("/menu");
  };

  useEffect(() => {
    // Analytics: In a real app we'd log the campaign impression here
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 relative to-purple-600 flex flex-col pt-12">
      {/* Dynamic Header */}
      <div className="text-center px-6">
        <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight mb-4 animate-fade-in-up">
          Limited Time <br /> Special Offer
        </h1>
        {session?.location && (
          <p className="text-indigo-100 font-medium mb-8">
            Exclusive to guests near: {session.location}
          </p>
        )}
      </div>

      {/* Campaign Card */}
      <div className="mx-4 bg-white rounded-3xl shadow-2xl p-8 text-center animate-fade-in fade-in relative overflow-hidden">
        {/* Decorative Badge */}
        <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-bl-xl origin-top-right transform rotate-12 mt-2 -mr-2">
          SALE
        </div>

        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Claim 20% Off Your First Order!</h2>
        <p className="text-gray-500 mb-8">
          Unlock this exclusive discount by using our Smart Shopping platform today. Minimum spend applies.
        </p>
        
        <button 
          onClick={handleClaim}
          className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all cursor-pointer hover:-translate-y-1"
        >
          Claim Offer & View Menu
        </button>
        <button className="w-full mt-4 text-gray-400 font-medium hover:text-gray-600">
          No thanks
        </button>
      </div>
      
      {/* Bottom spacer for balance */}
      <div className="flex-1"></div>
    </div>
  );
}
