import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import { PLANS } from "../config/plans";

export default function Pricing() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  return (
    <div className="min-h-screen bg-white pb-24">
      <nav className="border-b border-gray-100 px-4 sm:px-6 lg:px-8 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between h-20 items-center">
          <Link to="/"><Logo /></Link>
          <div className="hidden md:flex gap-8 items-center text-sm font-bold text-gray-500">
            <Link to="/how-it-works" className="hover:text-green-600 transition">How it Works</Link>
            <Link to="/explore" className="hover:text-green-600 transition">Marketplace</Link>
            <Link to="/login" className="hover:text-green-600 transition text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">Login</Link>
            <Link to="/request-access" className="bg-green-600 text-white px-6 py-2.5 rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-500/20">Get Started</Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
             onClick={() => setShowMobileMenu(!showMobileMenu)}
             className="md:hidden p-2 text-gray-500 hover:text-green-600 transition"
          >
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={showMobileMenu ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
             </svg>
          </button>
        </div>

        {/* Mobile Menu Panel */}
        {showMobileMenu && (
           <div className="md:hidden bg-white border-t border-gray-100 py-6 px-4 space-y-4 animate-in slide-in-from-top duration-300">
              <Link to="/how-it-works" className="block text-lg font-bold text-gray-900">How it Works</Link>
              <Link to="/explore" className="block text-lg font-bold text-gray-900">Marketplace</Link>
              <Link to="/login" className="block text-lg font-bold text-gray-900">Login</Link>
              <Link to="/request-access" className="block bg-green-600 text-white text-center py-4 rounded-xl font-black">Get Started</Link>
           </div>
        )}
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
         <div className="text-center mb-20 animate-in fade-in slide-in-from-top-4 duration-700">
            <h1 className="text-4xl sm:text-6xl font-black text-gray-900 mb-6 tracking-tight">Our Plans & Pricing</h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">Simple, transparent pricing to help you scale your business from the first order to the ten-thousandth.</p>
         </div>

         <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {PLANS.map((plan) => (
               <div 
                  key={plan.id}
                  className={`rounded-[2.5rem] p-10 border-2 flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${plan.theme === 'dark' ? 'bg-gray-900 border-gray-900 text-white shadow-xl shadow-gray-200' : 'bg-white border-gray-100 text-gray-900 shadow-sm'}`}
               >
                  {plan.popular && (
                     <div className="bg-green-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full self-start mb-6">Most Popular</div>
                  )}
                  
                  <h3 className="text-2xl font-black mb-1">{plan.name}</h3>
                  <p className={`text-xs uppercase tracking-widest font-bold mb-8 ${plan.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{plan.shortDesc}</p>
                  
                  <div className="mb-10">
                     <div className="flex items-baseline gap-1">
                        <span className="text-10 text-gray-400 font-bold tracking-tighter self-start mt-1">KSh</span>
                        <span className="text-5xl font-black">{plan.priceLabel}</span>
                        <span className="text-sm font-bold uppercase tracking-widest text-gray-400">/ mo</span>
                     </div>
                  </div>
                  
                  <ul className="space-y-5 mb-12 flex-1">
                     {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex gap-4 text-sm items-start">
                           <span className={feat.active ? 'text-green-500 font-bold' : 'text-gray-300'}>
                              {feat.active ? '✓' : '✗'}
                           </span>
                           <span className={`${plan.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} ${feat.strong ? 'font-black text-white' : ''}`}>
                              {feat.text}
                           </span>
                        </li>
                     ))}
                  </ul>
                  
                  <Link 
                     to="/request-access"
                     className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest text-center transition shadow-lg ${plan.theme === 'dark' ? 'bg-green-600 text-white hover:bg-green-500 shadow-green-900/40' : 'bg-gray-900 text-white hover:bg-black shadow-gray-200'}`}
                  >
                     {plan.id === 'free' ? 'Join Waitlist' : 'Select ' + plan.name}
                  </Link>
               </div>
            ))}
         </div>

         <section className="mt-28 bg-gray-50 rounded-[3rem] p-12 text-center">
            <h2 className="text-2xl font-black mb-4">Need a Custom Enterprise Solution?</h2>
            <p className="text-gray-500 mb-8 max-w-xl mx-auto">For multi-location chains and high-volume distribution networks, we offer tailored infrastructure and dedicated support.</p>
            <Link to="/contact" className="text-green-600 font-black uppercase tracking-widest text-sm hover:underline">Speak with an Expert →</Link>
         </section>
      </main>
    </div>
  );
}
