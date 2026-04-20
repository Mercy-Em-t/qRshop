import { useState } from "react";
import { supabase } from "../services/supabase-client";
import { useNavigate } from "react-router-dom";

export default function OnboardingWizard({ shopId, onComplete }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Step 2 Form State
  const [menuName, setMenuName] = useState("");
  const [menuPrice, setMenuPrice] = useState("");

  const handleCreateMenu = async (e) => {
    e.preventDefault();
    if (!menuName || !menuPrice) return;
    setLoading(true);

    const { error } = await supabase.from("menu_items").insert({
      shop_id: shopId,
      name: menuName,
      price: parseFloat(menuPrice),
      category: "Main",
      description: "My very first item!"
    });

    setLoading(false);
    if (!error) {
      setStep(3);
    } else {
      alert("Failed to create menu item. " + error.message);
    }
  };

  const handleGenerateQR = async () => {
    setLoading(true);
    const { error } = await supabase.from("qrs").insert({
      shop_id: shopId,
      location: "Table 1",
      action: "open_menu",
    });

    setLoading(false);
    if (!error) {
      setStep(4);
    } else {
      alert("Failed to generate QR node. " + error.message);
    }
  };

  const handleFinish = () => {
    localStorage.setItem(`onboarded_${shopId}`, "true");
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all">
        {/* Progress Bar */}
        <div className="w-full bg-gray-100 h-2">
          <div 
            className="bg-indigo-600 h-2 transition-all duration-500 ease-out" 
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="text-center animate-fade-in-up">
              <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">👋</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Modern Savannah!</h2>
              <p className="text-gray-500 mb-8">
                Let's get your digital storefront ready to capture customers. We will set up your first menu item and your first smart QR code in just 2 minutes.
              </p>
              <button
                onClick={() => setStep(2)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-transform hover:-translate-y-0.5"
              >
                Start Setup
              </button>
              <button
                onClick={handleFinish}
                className="w-full mt-4 text-gray-400 text-sm font-medium hover:text-gray-600 transition"
              >
                Skip for now
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in fade-in">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">1. Your First Item</h2>
              <p className="text-gray-500 mb-6">
                Add a popular item to your digital menu. You can add more later!
              </p>
              
              <form onSubmit={handleCreateMenu} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                  <input
                    required
                    autoFocus
                    type="text"
                    value={menuName}
                    onChange={(e) => setMenuName(e.target.value)}
                    placeholder="e.g. Signature Coffee"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (KSh)</label>
                  <input
                    required
                    type="number"
                    value={menuPrice}
                    onChange={(e) => setMenuPrice(e.target.value)}
                    placeholder="e.g. 250"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold py-3 px-4 rounded-xl shadow-md transition"
                >
                  {loading ? "Saving..." : "Save Menu Item"}
                </button>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="text-center animate-fade-in fade-in">
              <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">2. Your First QR Node</h2>
              <p className="text-gray-500 mb-8">
                Awesome! Now let's generate your first physical touchpoint. This QR code will act as a digital waiter for "Table 1".
              </p>
              
              <button
                onClick={handleGenerateQR}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-4 rounded-xl shadow-md transition"
              >
                {loading ? "Generating..." : "Generate Smart QR"}
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="text-center animate-fade-in-up">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🎉</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">You're All Set!</h2>
              <p className="text-gray-500 mb-8 max-w-xs mx-auto">
                Your menu is live and your first smart QR code is ready in the QR Manager. 
              </p>
              
              <button
                onClick={handleFinish}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-transform hover:-scale-105"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
