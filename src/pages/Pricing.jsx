import { Link } from "react-router-dom";
import ComingSoonGuard from "../components/ComingSoonGuard";
import Logo from "../components/Logo";

const PLANS = [
  {
    id: 'free',
    name: 'Free Starter',
    price: 0,
    priceLabel: '0',
    shortDesc: 'Perfect for testing and very small shops.',
    features: [
      { text: 'Digital Menu (Unlimited)', active: true, strong: true },
      { text: 'WhatsApp Ordering', active: true },
      { text: '50 items max', active: true },
      { text: 'Basic Analytics', active: true },
      { text: 'Custom Branding', active: false },
      { text: 'Inventory Tracking', active: false },
    ],
    theme: 'light',
    colorTag: 'green'
  },
  {
    id: 'pro',
    name: 'Pro Growth',
    price: 1500,
    priceLabel: '1,500',
    shortDesc: 'For active shops ready to scale.',
    popular: true,
    features: [
      { text: 'Everything in Free', active: true },
      { text: 'Unlimited items', active: true, strong: true },
      { text: 'Rich Analytics (Realtime)', active: true },
      { text: 'Custom Branding', active: true },
      { text: 'Smart Order Revisions', active: true, strong: true },
      { text: 'Inventory Sync (Soon)', active: false },
    ],
    theme: 'dark',
    colorTag: 'green'
  },
  {
     id: 'business',
     name: 'Business Elite',
     price: 4500,
     priceLabel: '4,500',
     shortDesc: 'Complete platform automation.',
     features: [
       { text: 'Everything in Pro', active: true },
       { text: 'M-Pesa STK Integration', active: true, strong: true },
       { text: 'Domain Customization', active: true },
       { text: 'Priority Support', active: true },
       { text: 'Kitchen Stream (Live)', active: true, strong: true },
       { text: 'Multi-User Access', active: true },
     ],
     theme: 'light_accent',
     colorTag: 'blue'
  },
  {
     id: 'agency',
     name: 'Agency White-Label',
     price: 15000,
     priceLabel: '15,000+',
     shortDesc: 'Run your own marketplace.',
     features: [
       { text: 'Sub-reseller rights', active: true, strong: true },
       { text: 'Revenue sharing (80/20)', active: true },
       { text: 'Regional Jurisdictions', active: true },
       { text: 'Agency Dashboard', active: true },
       { text: 'Batch QR Generation', active: true, strong: true },
       { text: 'API Access', active: true },
     ],
     theme: 'light',
     colorTag: 'purple'
  }
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-gray-100 px-4 sm:px-6 lg:px-8 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between h-20 items-center">
          <Link to="/"><Logo /></Link>
          <div className="hidden md:flex gap-8 items-center text-sm font-bold text-gray-500">
            <Link to="/" className="hover:text-theme-secondary transition">Home</Link>
            <Link to="/explore" className="hover:text-theme-secondary transition">Marketplace</Link>
            <Link to="/login" className="bg-theme-secondary text-white px-6 py-2.5 rounded-xl hover:bg-theme-main transition shadow-lg shadow-purple-500/20">Get Started</Link>
          </div>
        </div>
      </nav>

      <div className="flex-1 relative">
         {/* Pricing Section (Locked) */}
         <ComingSoonGuard 
            title="Simple Pricing." 
            message="Our advanced billing infrastructure is almost ready. You can get started right now completely for free."
            primaryLabel="Start Free Account"
            primaryAction="/signup"
            secondaryLabel="Return to Homepage"
            secondaryAction="/"
         >
            <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
               <div className="text-center mb-16">
                  <h2 className="text-4xl font-black text-gray-900">Simple Pricing.</h2>
                  <p className="text-gray-500 mt-4 max-w-xl mx-auto">Start free, upgrade as you grow. No hidden platform taxes.</p>
               </div>

               <div className="grid md:grid-cols-4 gap-6">
                  {PLANS.map(plan => {
                     const isDark = plan.theme === 'dark';
                     const isAccent = plan.theme === 'light_accent';
                     
                     const iconColors = {
                        green: isDark ? 'text-green-400' : 'text-green-500',
                        blue: isDark ? 'text-blue-400' : 'text-blue-500',
                        purple: isDark ? 'text-purple-400' : 'text-purple-500'
                     };
                     
                     return (
                        <div key={plan.id} className={`${isDark ? 'bg-gray-900 border-gray-800 shadow-xl scale-105 z-10' : 'bg-white shadow-sm border-gray-100'} ${isAccent ? 'border-blue-100 overflow-hidden' : ''} rounded-3xl p-8 border flex flex-col relative`}>
                           
                           {plan.popular && <div className={`absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest`}>Most Popular</div>}
                           
                           <h3 className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                           <p className={`text-3xl font-black mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{plan.priceLabel} <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>KSh/mo</span></p>
                           <p className={`text-xs mb-6 pb-6 border-b ${isDark ? 'text-gray-400 border-gray-800' : 'text-gray-500 border-gray-100'}`}>{plan.shortDesc}</p>
                           
                           <ul className="space-y-4 mb-8 flex-1">
                              {plan.features.map((feat, idx) => (
                                 <li key={idx} className={`flex gap-3 text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                                    <span className={feat.active ? iconColors[plan.colorTag] : 'text-gray-300'}>{feat.active ? '✓' : '✗'}</span>
                                    <span className={feat.strong ? 'font-bold' : ''}>{feat.text}</span>
                                 </li>
                              ))}
                           </ul>
                           
                           <button disabled className={`w-full text-center py-4 rounded-xl font-black transition text-sm uppercase tracking-widest ${isDark ? 'bg-theme-secondary text-white hover:bg-theme-main' : isAccent ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'border-2 border-slate-100 text-slate-400 hover:border-theme-secondary hover:text-theme-secondary'}`}>
                              Finalizing...
                           </button>
                        </div>
                     );
                  })}
               </div>
            </section>
         </ComingSoonGuard>
      </div>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-2 grayscale opacity-50">
             <Logo textClassName="font-bold text-lg" />
           </div>
           
           <div className="flex gap-8 text-xs text-gray-500 font-bold uppercase tracking-widest">
              <Link to="/about" className="hover:text-gray-900 transition">About</Link>
              <Link to="/contact" className="hover:text-gray-900 transition">Contact Us</Link>
              <Link to="/privacy" className="hover:text-gray-900 transition">Privacy</Link>
           </div>
           
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">© 2026 ShopQR Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
