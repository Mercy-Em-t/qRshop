import { Link, useNavigate } from "react-router-dom";
import { logout } from "../services/auth-service";
import usePlanAccess from "../hooks/usePlanAccess";
import { PLANS } from "../config/plans";

export default function Plans() {
  const navigate = useNavigate();
  const planAccess = usePlanAccess();

  if (planAccess.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const currentPlan = planAccess.planId || "free";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="text-green-600 font-medium hover:text-green-700 transition">← Dashboard</Link>
          <h1 className="text-xl font-bold text-gray-800">Subscription Plans</h1>
          <button onClick={() => { logout(); navigate("/login"); }} className="text-sm font-bold text-red-500 hover:text-red-700 cursor-pointer">Logout</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 flex-1">
         <div className="grid md:grid-cols-4 gap-6">
            {PLANS.map((plan) => {
               const isActive = currentPlan === plan.id;
               const isDark = plan.theme === 'dark';
               const isAccent = plan.theme === 'light_accent';
               
               const iconColors = {
                  green: isDark ? 'text-green-400' : 'text-green-500',
                  blue: isDark ? 'text-blue-400' : 'text-blue-500',
                  purple: isDark ? 'text-purple-400' : 'text-purple-500'
               };

               const borderClasses = {
                  green: "border-green-500",
                  blue: "border-blue-500",
                  purple: "border-purple-500"
               };

               const badgeClasses = {
                  green: "bg-green-500 text-white",
                  blue: "bg-blue-500 text-white",
                  purple: "bg-purple-500 text-white"
               };

               const disabledBtnClasses = {
                  green: "bg-green-100 text-green-700 opacity-80 cursor-not-allowed",
                  blue: "bg-blue-100 text-blue-800 opacity-80 cursor-not-allowed",
                  purple: "bg-purple-100 text-purple-800 opacity-80 cursor-not-allowed"
               };

               const borderClass = isActive 
                  ? `border-4 ${borderClasses[plan.colorTag]} scale-105 relative z-10` 
                  : (isDark ? 'border border-gray-800' : isAccent ? 'border border-blue-100' : 'border border-gray-100');
               
               return (
                  <div key={plan.id} className={`${isDark ? 'bg-gray-900 shadow-xl' : 'bg-white shadow-sm'} rounded-3xl p-8 flex flex-col relative ${isAccent ? 'overflow-hidden' : ''} ${borderClass}`}>
                     {isActive ? (
                        <div className={`absolute -top-4 left-1/2 -translate-x-1/2 ${badgeClasses[plan.colorTag]} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm`}>Current Plan</div>
                     ) : plan.popular ? (
                        <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm`}>Most Popular</div>
                     ) : null}

                     {isAccent && <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-10 opacity-50"></div>}
                     
                     <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                     <p className={`text-3xl font-black mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.priceLabel} <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>KSh/mo</span></p>
                     <p className={`text-sm mb-6 pb-6 border-b ${isDark ? 'text-gray-400 border-gray-800' : 'text-gray-500 border-gray-100'}`}>{plan.shortDesc}</p>
                     
                     <ul className="space-y-4 mb-8 flex-1">
                        {plan.features.map((feat, idx) => (
                           <li key={idx} className={`flex gap-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                              <span className={feat.active ? iconColors[plan.colorTag] : 'text-gray-300'}>{feat.active ? '✓' : '✗'}</span>
                              <span className={feat.strong ? 'font-bold' : ''}>{feat.text}</span>
                           </li>
                        ))}
                     </ul>
                     
                     <button disabled={isActive} className={`w-full text-center py-3 rounded-xl font-bold transition shadow-sm ${isActive ? (isDark ? 'bg-gray-700 text-white cursor-not-allowed' : disabledBtnClasses[plan.colorTag]) : (isDark ? 'bg-green-500 text-white hover:bg-green-600 cursor-pointer' : isAccent ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer border border-blue-200' : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 cursor-pointer')}`}>
                        {isActive ? 'Active' : (plan.id === 'business' ? 'Contact Sales' : (plan.id === 'free' ? 'Locked' : 'Request Upgrade'))}
                     </button>
                  </div>
               );
            })}
         </div>

        <div className="mt-12 bg-white rounded-xl shadow-sm p-6 text-center border border-gray-100">
          <p className="text-gray-500 text-sm">To change your plan now, message support via WhatsApp.</p>
        </div>
      </main>
    </div>
  );
}
