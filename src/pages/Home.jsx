import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PublicShopProfile from "./PublicShopProfile";
import { getShopBySubdomain } from "../services/shop-service";

// Define domains that should NEVER be treated as tenant subdomains
const RESERVED_DOMAINS = ["localhost", "127.0.0.1", "www", "tmsavannah.com", "tmsavannah", "shopqrplatform", "shopqr"];

export default function Home() {
  const [subdomainShopId, setSubdomainShopId] = useState(null);
  const [isVerifyingSubdomain, setIsVerifyingSubdomain] = useState(true);

  useEffect(() => {
    // Intercept wildcard subdomains natively on the client
    const hostname = window.location.hostname;
    const parts = hostname.split(".");
    
    // e.g. "shop1.tmsavannah.com" -> parts[0] is "shop1".
    // "localhost" -> parts[0] is "localhost"
    const parsedSubdomain = parts[0];

    // If it's a reserved core domain or standard IP, skip and show the regular Homepage
    const isReserved = RESERVED_DOMAINS.some(domain => hostname.includes(domain) && parts.length <= 2) || RESERVED_DOMAINS.includes(parsedSubdomain);

    if (isReserved) {
      setIsVerifyingSubdomain(false);
      return;
    }

    // We have what appears to be a legitimate tenant subdomain. Let's ask the database.
    async function checkSubdomain() {
       const shop = await getShopBySubdomain(parsedSubdomain);
       if (shop) {
          setSubdomainShopId(shop.id);
       }
       setIsVerifyingSubdomain(false);
    }
    
    checkSubdomain();
  }, []);

  // Show a blank/loading screen while we ask Supabase if this subdomain is real
  if (isVerifyingSubdomain) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>;
  }

  // If a shop was successfully found for this subdomain, hijack the Root Route and show the Shop!
  if (subdomainShopId) {
     return <PublicShopProfile directShopId={subdomainShopId} />;
  }

  // Otherwise, if no subdomain (or an invalid one) was found, show the standard Landing Page
  return (
    <div className="min-h-screen bg-gray-50 font-sans selection:bg-green-100 selection:text-green-900">
      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-green-600" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z" clipRule="evenodd" />
               <path d="M11 4a1 1 0 10-2 0v1a1 1 0 002 0V4zM10 7a1 1 0 011 1v1h2a1 1 0 110 2h-3a1 1 0 01-1-1V8a1 1 0 011-1zM16 9a1 1 0 100 2 1 1 0 000-2zM9 13a1 1 0 011-1h1a1 1 0 110 2v2a1 1 0 11-2 0v-3zM7 11a1 1 0 100-2H4a1 1 0 100 2h3zM17 13a1 1 0 10-2 0v1h-1a1 1 0 100 2h2a1 1 0 001-1v-2z" />
             </svg>
             <span className="font-bold text-xl tracking-tight text-gray-900">Savannah</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-gray-600 font-medium hover:text-green-600 transition">Log In</Link>
            <Link to="/request-access" className="bg-gray-900 text-white px-5 py-2 rounded-full font-medium hover:bg-gray-800 transition transform hover:scale-105">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
          The <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">smartest way</span> to take orders on WhatsApp.
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Turn your tables and catalogs into instant, structured WhatsApp orders. Stop manually decoding messages. Capture customer data automatically.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
           <Link to="/request-access" className="w-full sm:w-auto bg-green-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-green-700 transition shadow-lg hover:shadow-green-200 transform hover:-translate-y-1">Launch Your Shop for Free</Link>
           <a href="#pricing" className="w-full sm:w-auto text-gray-600 font-bold px-8 py-4 rounded-full border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition">View Pricing</a>
        </div>
      </section>

      {/* Value Proposition Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="grid md:grid-cols-3 gap-12 text-center">
              <div>
                 <div className="bg-green-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl">⚡</span>
                 </div>
                 <h3 className="text-xl font-bold text-gray-900 mb-3">Faster Order Handling</h3>
                 <p className="text-gray-500">Customers scan, select, and send a perfectly structured thermal-style receipt straight to your WhatsApp.</p>
              </div>
              <div>
                 <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl">🧠</span>
                 </div>
                 <h3 className="text-xl font-bold text-gray-900 mb-3">Customer Intelligence</h3>
                 <p className="text-gray-500">Automatically capture names and phone numbers before checkout. Build your real database instantly.</p>
              </div>
              <div>
                 <div className="bg-purple-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl">💰</span>
                 </div>
                 <h3 className="text-xl font-bold text-gray-900 mb-3">Higher Conversion</h3>
                 <p className="text-gray-500">Less back-and-forth chat means less friction. Review the clean order, confirm availability, and get paid faster.</p>
              </div>
           </div>
        </div>
      </section>

      {/* Pricing / Tiers */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
         <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Simple, scale-ready pricing.</h2>
            <p className="text-gray-500 mt-4 max-w-2xl mx-auto">Start instantly for free. Upgrade when our automation starts saving you hours of manual messaging.</p>
         </div>

         <div className="grid md:grid-cols-4 gap-6">
            {/* Free */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col">
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
               <Link to="/login" className="w-full text-center py-3 rounded-xl border-2 border-green-600 text-green-700 font-bold hover:bg-green-50 transition">Start Free</Link>
            </div>

            {/* Basic */}
            <div className="bg-gray-900 rounded-3xl p-8 border border-gray-800 shadow-xl flex flex-col relative transform md:-translate-y-4">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Most Popular</div>
               <h3 className="text-xl font-bold text-white mb-2">Basic</h3>
               <p className="text-3xl font-black text-white mb-1">1,200 <span className="text-sm font-medium text-gray-400">KSh/mo</span></p>
               <p className="text-sm text-gray-400 mb-6 pb-6 border-b border-gray-800">Clean orders, ready to act on.</p>
               <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex gap-3 text-sm text-gray-300"><span className="text-green-400">✓</span> <strong>Auto-checkout routing</strong></li>
                  <li className="flex gap-3 text-sm text-gray-300"><span className="text-green-400">✓</span> <strong>Structured thermal receipts</strong></li>
                  <li className="flex gap-3 text-sm text-gray-300"><span className="text-green-400">✓</span> <strong>Customer Identity Capture</strong></li>
                  <li className="flex gap-3 text-sm text-gray-300"><span className="text-green-400">✓</span> Active Order Dashboard</li>
               </ul>
               <Link to="/login" className="w-full text-center py-3 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 transition shadow-[0_0_20px_rgba(34,197,94,0.3)]">Upgrade to Basic</Link>
            </div>

            {/* Pro */}
            <div className="bg-white rounded-3xl p-8 border border-blue-100 shadow-sm flex flex-col relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-10 opacity-50"></div>
               <h3 className="text-xl font-bold text-gray-900 mb-2">Pro</h3>
               <p className="text-3xl font-black text-gray-900 mb-1">3,000 <span className="text-sm font-medium text-gray-500">KSh/mo</span></p>
               <p className="text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">Order intelligence & tracking.</p>
               <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex gap-3 text-sm text-gray-600"><span className="text-blue-500">✓</span> Everything in Basic</li>
                  <li className="flex gap-3 text-sm text-gray-800 font-medium"><span className="text-blue-500">✓</span> Smart Order Revisions</li>
                  <li className="flex gap-3 text-sm text-gray-800 font-medium"><span className="text-blue-500">✓</span> Historical Analytics Tracking</li>
                  <li className="flex gap-3 text-sm text-gray-600"><span className="text-blue-500">✓</span> Priority Notification Flows</li>
               </ul>
               <Link to="/login" className="w-full text-center py-3 rounded-xl bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition">Get Pro</Link>
            </div>

            {/* Business */}
            <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col">
               <h3 className="text-xl font-bold text-gray-900 mb-2">Business</h3>
               <p className="text-3xl font-black text-gray-900 mb-1">7,000+ <span className="text-sm font-medium text-gray-500">KSh/mo</span></p>
               <p className="text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">For scaling operations.</p>
               <ul className="space-y-4 mb-8 flex-1">
                  <li className="flex gap-3 text-sm text-gray-600"><span className="text-purple-500">✓</span> Everything in Pro</li>
                  <li className="flex gap-3 text-sm text-gray-800 font-medium"><span className="text-purple-500">✓</span> Automated STK Pushes (Soon)</li>
                  <li className="flex gap-3 text-sm text-gray-600"><span className="text-purple-500">✓</span> Multi-User Seat Access</li>
                  <li className="flex gap-3 text-sm text-gray-600"><span className="text-purple-500">✓</span> Native POS API Hooks</li>
               </ul>
               <Link to="/login" className="w-full text-center py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-300 transition">Contact Sales</Link>
            </div>
         </div>
      </section>

      {/* Footer / Legal Hooks */}
      <footer className="bg-white border-t border-gray-100 py-12 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-2 grayscale opacity-50">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
               <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z" clipRule="evenodd" />
             </svg>
             <span className="font-bold tracking-tight">Savannah</span>
           </div>
           
           <div className="flex gap-8 text-sm text-gray-500 font-medium">
              <Link to="/terms" className="hover:text-gray-900 transition">Terms of Service</Link>
              <Link to="/privacy" className="hover:text-gray-900 transition">Privacy Policy</Link>
           </div>
           
           <p className="text-sm text-gray-400">© 2026 Savannah Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
