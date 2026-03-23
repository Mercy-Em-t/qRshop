import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../services/auth-service";
import usePlanAccess from "../hooks/usePlanAccess";

export default function Plans() {
  const navigate = useNavigate();
  const planAccess = usePlanAccess();

  // Handle loading state
  if (planAccess.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
         <header className="bg-white shadow-sm">
           <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
             <Link to="/dashboard" className="text-green-600 font-medium hover:text-green-700 transition">← Dashboard</Link>
             <h1 className="text-xl font-bold text-gray-800">Subscription Plans</h1>
             <button onClick={() => { logout(); navigate("/login"); }} className="text-sm font-bold text-red-500 hover:text-red-700 cursor-pointer">Logout</button>
           </div>
         </header>
         <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
         </div>
      </div>
    );
  }

  const currentPlan = planAccess.planId || "free";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="text-green-600 font-medium hover:text-green-700 transition-colors"
          >
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Subscription Plans</h1>
          <button
            onClick={() => { logout(); navigate("/login"); }}
            className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 flex-1">
        <div className="text-center mb-10">
           <h2 className="text-2xl font-bold text-gray-900">Your Current Tier: <span className="uppercase text-green-600 bg-green-50 px-3 py-1 rounded-md border border-green-200">{currentPlan}</span></h2>
           <p className="text-gray-500 mt-2">To upgrade your plan, please contact our support team on WhatsApp.</p>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
            {/* Free */}
            <div className={`bg-white rounded-3xl p-8 shadow-sm flex flex-col ${currentPlan === 'free' ? 'border-4 border-green-500 scale-105 relative z-10' : 'border border-gray-100'}`}>
               {currentPlan === 'free' && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">Current Plan</div>}
               <h3 className="text-xl font-bold text-gray-900 mb-2">Free</h3>
               <p className="text-3xl font-black text-gray-900 mb-1">0 <span className="text-sm font-medium text-gray-500">KSh/mo</span></p>
               <p className="text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">Manual, basic starting point.</p>
               <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex gap-3 text-sm text-gray-600"><span className="text-green-500">✓</span> Click-to-chat orders</li>
                  <li className="flex gap-3 text-sm text-gray-600"><span className="text-green-500">✓</span> Digital Menu</li>
                  <li className="flex gap-3 text-sm text-gray-400"><span className="text-gray-300">✗</span> No auto-checkout</li>
                  <li className="flex gap-3 text-sm text-gray-400"><span className="text-gray-300">✗</span> No structured receipts</li>
                  <li className="flex gap-3 text-sm text-gray-400"><span className="text-gray-300">✗</span> No customer database</li>
               </ul>
               <button disabled className={`w-full text-center py-3 rounded-xl font-bold transition ${currentPlan === 'free' ? 'bg-green-100 text-green-700 opacity-80 cursor-not-allowed' : 'border-2 border-gray-200 text-gray-400 cursor-not-allowed'}`}>
                 {currentPlan === 'free' ? 'Active' : 'Locked'}
               </button>
            </div>

            {/* Basic */}
            <div className={`bg-gray-900 rounded-3xl p-8 shadow-xl flex flex-col relative ${currentPlan === 'basic' ? 'border-4 border-green-400 scale-105 z-10' : 'border border-gray-800'}`}>
               {currentPlan === 'basic' ? (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">Current Plan</div>
               ) : (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">Most Popular</div>
               )}
               <h3 className="text-xl font-bold text-white mb-2">Basic</h3>
               <p className="text-3xl font-black text-white mb-1">500 <span className="text-sm font-medium text-gray-400">KSh/mo</span></p>
               <p className="text-sm text-gray-400 mb-6 pb-6 border-b border-gray-800">Clean orders, ready to act on.</p>
               <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex gap-3 text-sm text-gray-300"><span className="text-green-400">✓</span> <strong>Auto-checkout routing</strong></li>
                  <li className="flex gap-3 text-sm text-gray-300"><span className="text-green-400">✓</span> <strong>Structured receipts</strong></li>
                  <li className="flex gap-3 text-sm text-gray-300"><span className="text-green-400">✓</span> <strong>Customer Identity Data</strong></li>
                  <li className="flex gap-3 text-sm text-gray-300"><span className="text-green-400">✓</span> Active Order Dashboard</li>
               </ul>
               <button disabled={currentPlan === 'basic'} className={`w-full text-center py-3 rounded-xl font-bold transition shadow-sm ${currentPlan === 'basic' ? 'bg-gray-700 text-white cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600 cursor-pointer'}`}>
                 {currentPlan === 'basic' ? 'Active' : 'Request Upgrade'}
               </button>
            </div>

            {/* Pro */}
            <div className={`bg-white rounded-3xl p-8 shadow-sm flex flex-col relative overflow-hidden ${currentPlan === 'pro' ? 'border-4 border-blue-500 scale-105 z-10' : 'border border-blue-100'}`}>
               {currentPlan === 'pro' && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">Current Plan</div>}
               <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-10 opacity-50"></div>
               <h3 className="text-xl font-bold text-gray-900 mb-2">Pro</h3>
               <p className="text-3xl font-black text-gray-900 mb-1">1,500 <span className="text-sm font-medium text-gray-500">KSh/mo</span></p>
               <p className="text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">Analytics & Tracking.</p>
               <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex gap-3 text-sm text-gray-600"><span className="text-blue-500">✓</span> Everything in Basic</li>
                  <li className="flex gap-3 text-sm text-gray-800 font-medium"><span className="text-blue-500">✓</span> Smart Revisions</li>
                  <li className="flex gap-3 text-sm text-gray-800 font-medium"><span className="text-blue-500">✓</span> Analytics Dashboard</li>
                  <li className="flex gap-3 text-sm text-gray-600"><span className="text-blue-500">✓</span> Marketing Campaigns</li>
               </ul>
               <button disabled={currentPlan === 'pro'} className={`w-full text-center py-3 rounded-xl font-bold transition ${currentPlan === 'pro' ? 'bg-blue-100 text-blue-800 cursor-not-allowed' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer border border-blue-200'}`}>
                 {currentPlan === 'pro' ? 'Active' : 'Request Upgrade'}
               </button>
            </div>

            {/* Business */}
            <div className={`bg-white rounded-3xl p-8 shadow-sm flex flex-col ${currentPlan === 'business' || currentPlan === 'enterprise' ? 'border-4 border-purple-500 scale-105 relative z-10' : 'border border-gray-100'}`}>
               {(currentPlan === 'business' || currentPlan === 'enterprise') && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">Current Plan</div>}
               <h3 className="text-xl font-bold text-gray-900 mb-2">Business</h3>
               <p className="text-3xl font-black text-gray-900 mb-1">3,000 <span className="text-sm font-medium text-gray-500">KSh/mo</span></p>
               <p className="text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">For scaling operations.</p>
               <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex gap-3 text-sm text-gray-600"><span className="text-purple-500">✓</span> Everything in Pro</li>
                  <li className="flex gap-3 text-sm text-gray-800 font-medium"><span className="text-purple-500">✓</span> Multi-User Seat Access</li>
                  <li className="flex gap-3 text-sm text-gray-800 font-medium"><span className="text-purple-500">✓</span> API Integrations</li>
                  <li className="flex gap-3 text-sm text-gray-600"><span className="text-purple-500">✓</span> Native POS Hooks</li>
               </ul>
               <button disabled={currentPlan === 'business' || currentPlan === 'enterprise'} className={`w-full text-center py-3 rounded-xl font-bold transition ${currentPlan === 'business' || currentPlan === 'enterprise' ? 'bg-purple-100 text-purple-800 cursor-not-allowed' : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 cursor-pointer'}`}>
                 {currentPlan === 'business' || currentPlan === 'enterprise' ? 'Active' : 'Contact Sales'}
               </button>
            </div>
         </div>

        <div className="mt-12 bg-white rounded-xl shadow-sm p-6 text-center border border-gray-100">
          <p className="text-gray-500 text-sm">
            Self-service upgrades and payment processing will be available after M-Pesa integration is enabled. To change your plan now, message support via WhatsApp.
          </p>
        </div>
      </main>
    </div>
  );
}
