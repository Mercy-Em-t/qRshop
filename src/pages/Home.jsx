import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Scanner } from '@yudiel/react-qr-scanner';
import PublicShopProfile from "./PublicShopProfile";
import Footer from "../components/Footer";
import Logo from "../components/Logo";
import { getShopBySubdomain } from "../services/shop-service";
import { PLANS } from "../config/plans";

// Modern Savannah Launch v2.3b
// Define domains that should NEVER be treated as tenant subdomains
const RESERVED_DOMAINS = ["localhost", "127.0.0.1", "www", "tmsavannah.com", "tmsavannah", "savannah", "modernsavannah"];

export default function Home() {
  const [subdomainShopId, setSubdomainShopId] = useState(null);
  const [isVerifyingSubdomain, setIsVerifyingSubdomain] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef(null);
  const navigate = useNavigate();

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

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from("menu_items")
          .select("*, shops(name, id)")
          .textSearch("fts_vector", query, { config: 'english', type: 'plain' })
          .limit(8);
        
        if (!error) setSearchResults(data);
      } catch (e) {
        console.error("Search failed", e);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

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
          <Link to="/" className="flex items-center">
             <Logo className="h-7 w-7" />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-gray-600 font-medium hover:text-green-600 transition">Log In</Link>
            <Link to="/request-access" className="bg-gray-900 text-white px-5 py-2 rounded-full font-medium hover:bg-gray-800 transition transform hover:scale-105">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
                <h1 className="text-4xl sm:text-6xl font-black text-gray-900 mb-6 tracking-tighter leading-tight italic">
                  The <span className="text-safari-green">Modern</span> <span className="text-savannah-ochre not-italic">Savannah OS v2.3.</span>
                </h1>
               <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed">
                 The expansive ecosystem for digital shops, smart restaurants, and borderless commerce. Build your storefront in minutes, rooted in Africa and connected to the world.
               </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
           <Link to="/explore" className="w-full sm:w-auto bg-green-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-green-700 transition shadow-lg hover:shadow-green-200 transform hover:-translate-y-1">Enter the Marketplace</Link>
           <Link to="/request-access" className="w-full sm:w-auto text-gray-700 font-bold px-8 py-4 rounded-full border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition">Create a Smart Shop</Link>
        </div>

        {/* Global Product Search (O(log n) discovery) */}
        <div className="mt-16 max-w-xl mx-auto relative px-4">
           <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 flex items-center gap-2 group focus-within:ring-2 ring-green-500/20 transition-all">
              <div className="pl-4 text-green-600">
                 {isSearching ? <div className="w-5 h-5 border-2 border-green-600 border-t-transparent animate-spin rounded-full"></div> : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>}
              </div>
              <input 
                 type="text" 
                 placeholder="Search products, meals, or shops..." 
                 className="flex-1 py-3 text-lg font-medium outline-none text-gray-800 placeholder:text-gray-400"
                 value={searchQuery}
                 onChange={(e) => handleSearch(e.target.value)}
              />
           </div>

           {/* Trending Discovery Tags */}
           <div className="mt-4 flex flex-wrap items-center justify-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
              <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Trending Now:</span>
              {["Burgers", "Hardware", "Sneakers", "Pharmacy", "Electronics"].map(tag => (
                 <button 
                    key={tag}
                    onClick={() => handleSearch(tag)}
                    className="bg-white hover:bg-green-50 text-gray-600 hover:text-green-700 text-[11px] font-bold px-4 py-1.5 rounded-full border border-gray-100 hover:border-green-200 transition-all shadow-sm"
                 >
                    {tag}
                 </button>
              ))}
           </div>

           {/* Results Dropdown */}
           {searchResults.length > 0 && searchQuery.length >= 2 && (
              <div className="absolute top-full left-4 right-4 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
                 {searchResults.map(item => (
                    <Link 
                       key={item.id} 
                       to={`/shops/${item.shops?.id}`}
                       className="flex items-center gap-4 px-6 py-4 hover:bg-green-50 transition cursor-pointer group"
                    >
                       <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xl shadow-inner group-hover:bg-white transition-colors">
                          {item.product_images?.[0] ? <img src={item.product_images[0].url} className="w-full h-full object-cover rounded-lg" alt="" /> : '📦'}
                       </div>
                       <div className="text-left flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 truncate">{item.name}</h4>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                             <span className="text-green-600 font-bold">KSh {item.price}</span>
                             <span>•</span>
                             <span className="truncate">{item.shops?.name}</span>
                          </p>
                       </div>
                       <svg className="w-5 h-5 text-gray-300 group-hover:text-green-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
                    </Link>
                 ))}
                 <div className="bg-gray-50 px-6 py-2 border-t border-gray-100">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Powered by Savannah FTS Index</p>
                 </div>
              </div>
           )}
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
            {PLANS.map(plan => {
               const isDark = plan.theme === 'dark';
               const isAccent = plan.theme === 'light_accent';
               
               const iconColors = {
                  green: isDark ? 'text-green-400' : 'text-green-500',
                  blue: isDark ? 'text-blue-400' : 'text-blue-500',
                  purple: isDark ? 'text-purple-400' : 'text-purple-500'
               };
               
               return (
                  <div key={plan.id} className={`${isDark ? 'bg-gray-900 border-gray-800 shadow-xl transform md:-translate-y-4' : 'bg-white shadow-sm border-gray-100'} ${isAccent ? 'border-blue-100 overflow-hidden' : ''} rounded-3xl p-8 border flex flex-col relative`}>
                     
                     {plan.popular && <div className={`absolute top-0 left-1/2 -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider`}>Most Popular</div>}
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
                     
                     <Link to={plan.buttonLink} className={`w-full text-center py-3 rounded-xl font-bold transition ${isDark ? 'bg-green-500 text-white hover:bg-green-600 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : isAccent ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : plan.id === 'free' ? 'border-2 border-green-600 text-green-700 hover:bg-green-50' : 'border-2 border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'}`}>
                        {plan.buttonLabel}
                     </Link>
                  </div>
               );
            })}
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

      {/* Floating QR Scanner Button */}
      {!subdomainShopId && (
         <button 
           onClick={() => setShowScanner(true)}
           className="fixed bottom-6 right-6 w-16 h-16 bg-green-600 text-white rounded-full shadow-[0_10px_25px_rgba(34,197,94,0.4)] flex items-center justify-center hover:bg-green-700 hover:scale-105 transition-transform z-50 cursor-pointer border-4 border-white"
         >
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
             <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
             <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
           </svg>
         </button>
      )}

      {/* Scanner Modal Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-[60] bg-black bg-opacity-90 flex flex-col items-center justify-center p-4">
           <div className="w-full max-w-sm relative">
              <button 
                onClick={() => setShowScanner(false)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 p-2 cursor-pointer z-50 bg-white/20 rounded-full"
              >
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
              
              <div className="bg-white p-2 rounded-2xl shadow-2xl overflow-hidden aspect-square border-4 border-gray-800">
                 <Scanner 
                    formats={["qr_code"]}
                    onScan={(result) => {
                       if (result && result.length > 0) {
                          const decodedText = result[0].rawValue;
                          
                          // Domain Validation for QR Security
                          try {
                             const url = new URL(decodedText);
                             const isInternal = url.hostname.endsWith("tmsavannah.com") || 
                                              url.hostname === "localhost" || 
                                              url.hostname === "127.0.0.1";
                             
                             if (isInternal) {
                                setShowScanner(false);
                                // If same origin, use navigate for SPA performance
                                if (url.origin === window.location.origin) {
                                   navigate(url.pathname + url.search);
                                } else {
                                   window.location.href = decodedText;
                                }
                             } else {
                                alert("🔒 Security Block: External QR codes are not allowed to redirect through this scanner.");
                             }
                          } catch (err) {
                             alert("Invalid QR Payload: " + decodedText);
                          }
                       }
                    }} 
                 />
              </div>
              <p className="mt-6 text-center text-white/70 font-medium tracking-wide">Align QR Code within the frame to scan seamlessly.</p>
           </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
