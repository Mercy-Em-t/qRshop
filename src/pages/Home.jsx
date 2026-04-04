import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import { Scanner } from "@yudiel/react-qr-scanner";

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
    buttonLabel: 'Get Started',
    buttonLink: '/login',
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
    buttonLabel: 'Upgrade Home',
    buttonLink: '/plans',
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
     buttonLabel: 'Contact Sales',
     buttonLink: '/contact',
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
     buttonLabel: 'Inquire Now',
     buttonLink: '/contact',
     theme: 'light',
     colorTag: 'purple'
  }
];

export default function Home() {
  const [showScanner, setShowScanner] = useState(false);
  const [isUnknownSubdomain, setIsUnknownSubdomain] = useState(false);

  useEffect(() => {
     // SEO Security: If we've landed on Home via an unknown subdomain (wildcard fallback)
     // we must tell robots not to index it as duplicate content.
     const hostname = window.location.hostname;
     const parts = hostname.split('.');
     const isLocal = hostname === 'localhost' || hostname.includes('127.0.0.1');
     const isVercel = hostname.includes('vercel.app');
     
     if (!isLocal && !isVercel && parts.length >= 3 && parts[0] !== 'www') {
        setIsUnknownSubdomain(true);
     }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 px-4 sm:px-6 lg:px-8 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between h-20 items-center">
          <Logo />
          <div className="hidden md:flex gap-8 items-center text-sm font-bold text-gray-500">
            <a href="#features" className="hover:text-green-600 transition">Features</a>
            <a href="#pricing" className="hover:text-green-600 transition">Pricing</a>
            <a href="/explore" className="hover:text-green-600 transition">Marketplace</a>
            <Link to="/login" className="hover:text-green-600 transition">Login</Link>
            <Link to="/request-access" className="bg-green-600 text-white px-6 py-2.5 rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-500/20">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
        <h1 className="text-5xl sm:text-7xl font-black text-gray-900 tracking-tight leading-[1.1] mb-6">
          Your Shop, <br/> 
          <span className="text-green-600">On WhatsApp.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          The simplest way to digitize your menu and handle orders directly on WhatsApp. No complex apps, just a scan and a chat.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/request-access" className="w-full sm:w-auto bg-green-600 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-green-700 transition shadow-2xl shadow-green-600/30 hover:-translate-y-1 active:scale-95">
             Get Started Free
          </Link>
          <a href="#pricing" className="w-full sm:w-auto px-10 py-5 rounded-2xl font-bold text-gray-400 hover:text-gray-900 transition">
             View Plans & Pricing
          </a>
        </div>
      </header>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
           <div className="grid md:grid-cols-3 gap-12 text-center">
              <div>
                 <div className="bg-green-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl">📱</span>
                 </div>
                 <h3 className="text-xl font-bold text-gray-900 mb-3">Direct-to-WhatsApp</h3>
                 <p className="text-gray-500">Orders land directly in your WhatsApp inbox with a clean, summarized list and client contact details.</p>
              </div>
              <div>
                 <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl">📊</span>
                 </div>
                 <h3 className="text-xl font-bold text-gray-900 mb-3">Real-time Analytics</h3>
                 <p className="text-gray-500">Know your top items, peak hours, and revenue trends without complex spreadsheets.</p>
              </div>
              <div>
                 <div className="bg-purple-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl">💰</span>
                 </div>
                 <h3 className="text-xl font-bold text-gray-900 mb-3">Higher Conversion</h3>
                 <p className="text-gray-500">Less friction for customers means more orders. No account required to browse your menu.</p>
              </div>
           </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
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
                     
                     <Link to={plan.buttonLink} className={`w-full text-center py-4 rounded-xl font-black transition text-sm uppercase tracking-widest ${isDark ? 'bg-green-600 text-white hover:bg-green-700' : isAccent ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'border-2 border-slate-100 text-slate-400 hover:border-green-600 hover:text-green-600'}`}>
                        {plan.buttonLabel}
                     </Link>
                  </div>
               );
            })}
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-2 grayscale opacity-50">
             <Logo textClassName="font-bold text-lg" />
           </div>
           
           <div className="flex gap-8 text-xs text-gray-500 font-bold uppercase tracking-widest">
              <Link to="/about" className="hover:text-gray-900 transition">About</Link>
              <Link to="/contact" className="hover:text-gray-900 transition">Contact Us</Link>
              <Link to="/advertise" className="hover:text-gray-900 transition">Advertising</Link>
              <Link to="/terms" className="hover:text-gray-900 transition">Terms</Link>
              <Link to="/privacy" className="hover:text-gray-900 transition">Privacy</Link>
           </div>
           
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">© 2026 ShopQR Platform. All rights reserved.</p>
        </div>
      </footer>

      <button 
        onClick={() => setShowScanner(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-green-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-green-700 hover:scale-110 transition-all z-50 cursor-pointer border-4 border-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
           <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15a2.25 2.25 0 0 0 2.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
           <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
        </svg>
      </button>

      {showScanner && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-4">
           <div className="w-full max-w-sm relative">
              <button 
                onClick={() => setShowScanner(false)}
                className="absolute -top-16 right-0 text-white p-4 cursor-pointer"
              >
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
              <div className="bg-white p-2 rounded-3xl shadow-2xl overflow-hidden aspect-square border-8 border-white/20">
                <Scanner 
                   formats={["qr_code"]}
                   onScan={(result) => {
                      if (result && result.length > 0) {
                         const decodedText = result[0].rawValue;
                         window.location.href = decodedText;
                      }
                   }} 
                />
              </div>
              <p className="mt-8 text-center text-white/50 font-black uppercase tracking-widest text-xs">Scan any ShopQR Menu</p>
           </div>
        </div>
      )}
    </div>
  );
}
