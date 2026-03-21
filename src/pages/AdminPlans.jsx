import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../services/auth-service";

export default function AdminPlans() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  // Mocked global plan configurations for the MVP
  const [plans, setPlans] = useState([
    {
      id: "free",
      name: "Free",
      price: "KSh 0 /mo",
      features: ["Click-to-chat orders only", "Basic Live Feed", "Maximum 50 Menu Items", "1 Active QR Node"],
      color: "gray"
    },
    {
      id: "basic",
      name: "Basic",
      price: "KSh 500 /mo",
      features: ["Auto-checkout", "Structured receipts", "M-Pesa Auto-Checkout"],
      color: "green"
    },
    {
      id: "pro",
      name: "Pro",
      price: "KSh 1,500 /mo",
      features: ["Smart revisions & analytics", "Custom Subdomain", "Unlimited QR Nodes"],
      color: "blue"
    },
    {
      id: "business",
      name: "Business",
      price: "KSh 3,000 /mo",
      features: ["Full scale operations", "Automated WhatsApp Dispatch"],
      color: "purple"
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "Custom",
      features: ["Custom integrations", "White-label Branding", "Dedicated Account Manager", "API Access"],
      color: "amber"
    }
  ]);

  useEffect(() => {
    // Lock down to System Admin only!
    if (!user || user.role !== "system_admin") {
      navigate("/login");
    }
  }, [navigate]);

  const handleUpdateFeature = (planId, featureIdx, newText) => {
    const updated = plans.map(p => {
      if (p.id === planId) {
        const newFeatures = [...p.features];
        newFeatures[featureIdx] = newText;
        return { ...p, features: newFeatures };
      }
      return p;
    });
    setPlans(updated);
  };

  const handleSave = () => {
     alert("Global pricing tiers updated successfully! All active subscriber shops will see these changes.");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/admin"
            className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
          >
            ← System Admin
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Global Subscription Models</h1>
          <div className="flex items-center gap-4">
            <button
               onClick={() => { logout(); navigate("/login"); }}
               className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
            >
               Logout
            </button>
            <button 
               onClick={handleSave}
               className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow cursor-pointer hover:bg-indigo-700"
            >
               Publish Changes
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
           <h2 className="text-2xl font-black text-gray-900">Tier Configuration</h2>
           <p className="text-gray-500 mt-1">Define the limits and marketing copy for the subscription packages offered to your Shop owners.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
           {plans.map(plan => {
             const borderColor = {
                gray: "border-gray-400",
                green: "border-green-500",
                blue: "border-blue-500",
                purple: "border-purple-500",
                amber: "border-amber-500"
             }[plan.color] || "border-gray-400";
             const textColor = {
                gray: "text-gray-600",
                green: "text-green-600",
                blue: "text-blue-600",
                purple: "text-purple-600",
                amber: "text-amber-600"
             }[plan.color] || "text-gray-600";
             const focusColor = {
                gray: "focus:border-gray-300",
                green: "focus:border-green-300",
                blue: "focus:border-blue-300",
                purple: "focus:border-purple-300",
                amber: "focus:border-amber-300"
             }[plan.color] || "focus:border-gray-300";
             const hoverBgColor = {
                gray: "hover:bg-gray-50",
                green: "hover:bg-green-50",
                blue: "hover:bg-blue-50",
                purple: "hover:bg-purple-50",
                amber: "hover:bg-amber-50"
             }[plan.color] || "hover:bg-gray-50";

             return (
             <div key={plan.id} className={`bg-white rounded-2xl shadow-md border-t-8 p-6 flex flex-col ${borderColor}`}>
                <div className="mb-4">
                  <h3 className="text-xl font-extrabold text-gray-900">{plan.name}</h3>
                  <input 
                     value={plan.price}
                     onChange={(e) => {
                       setPlans(plans.map(p => p.id === plan.id ? { ...p, price: e.target.value } : p));
                     }}
                     className={`mt-2 text-2xl font-black ${textColor} w-full outline-none bg-transparent border-b-2 border-transparent ${focusColor} transition-colors`}
                  />
                  <p className="text-xs font-bold text-gray-400 uppercase mt-4 mb-2 tracking-widest">Included Capabilities</p>
                </div>
                
                <div className="flex-1 space-y-3">
                   {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex gap-2 items-start group">
                        <span className="text-green-500 font-bold mt-1">✓</span>
                        <input 
                           type="text"
                           value={feature}
                           onChange={(e) => handleUpdateFeature(plan.id, idx, e.target.value)}
                           className={`flex-1 text-gray-700 bg-gray-50 hover:bg-gray-100 focus:bg-white border focus:border-transparent rounded px-2 py-1 outline-none text-sm transition-colors ${focusColor}`}
                        />
                      </div>
                   ))}
                   
                   <button 
                      onClick={() => {
                        const newText = prompt("Enter new capability:");
                        if (newText) {
                           const updated = plans.map(p => p.id === plan.id ? { ...p, features: [...p.features, newText] } : p);
                           setPlans(updated);
                        }
                      }}
                      className={`${textColor} text-sm font-bold mt-4 w-full text-left px-2 py-2 ${hoverBgColor} rounded transition-colors`}
                   >
                     + Add Capability
                   </button>
                </div>
             </div>
           )})}
        </div>
      </main>
    </div>
  );
}
