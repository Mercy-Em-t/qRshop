import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useStandalone } from "../hooks/useStandalone";
import { useState as useReactState } from "react";
import PublicLayout from "../components/public/PublicLayout";

export default function Home() {
  const [showScanner, setShowScanner] = useState(false);
  const [isUnknownSubdomain, setIsUnknownSubdomain] = useState(false);
  const [authView, setAuthView] = useState("login"); // 'login' | 'signup' | 'request'
  const isStandalone = useStandalone();

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

  if (isStandalone) {
     return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 sm:p-12">
           <div className="w-full max-w-sm">
              <div className="flex justify-center mb-12">
                 <Logo size="lg" />
              </div>

              <div className="bg-gray-50 p-1 rounded-2xl flex mb-8">
                 <button 
                    onClick={() => setAuthView("login")}
                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition ${authView === 'login' ? 'bg-white shadow text-gray-900' : 'text-gray-400'}`}
                 >
                    Login
                 </button>
                 <button 
                    onClick={() => setAuthView("signup")}
                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition ${authView === 'signup' ? 'bg-white shadow text-gray-900' : 'text-gray-400'}`}
                 >
                    Signup
                 </button>
                 <button 
                    onClick={() => setAuthView("request")}
                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition ${authView === 'request' ? 'bg-white shadow text-gray-900' : 'text-gray-400'}`}
                 >
                    Request
                 </button>
              </div>

              {authView === 'login' && (
                 <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-2xl font-black mb-2">Welcome Back</h2>
                    <p className="text-gray-500 mb-8">Login to manage your shops and orders.</p>
                    <Link to="/login" className="block w-full bg-theme-secondary text-white text-center py-4 rounded-xl font-bold hover:bg-theme-main transition shadow-xl">
                       Continue to Login
                    </Link>
                 </div>
              )}

              {authView === 'signup' && (
                 <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-2xl font-black mb-2">Grow your business</h2>
                    <p className="text-gray-500 mb-8">Start selling directly on Every Screen.</p>
                    <Link to="/signup" className="block w-full bg-theme-secondary text-white text-center py-4 rounded-xl font-bold hover:bg-theme-main transition shadow-xl">
                       Create Merchant Account
                    </Link>
                 </div>
              )}

              {authView === 'request' && (
                 <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h2 className="text-2xl font-black mb-2">Need Help?</h2>
                    <p className="text-gray-500 mb-8">Request access or custom setup for your shop.</p>
                    <Link to="/request-access" className="block w-full bg-gray-900 text-white text-center py-4 rounded-xl font-bold hover:bg-black transition shadow-xl">
                       Submit Request
                    </Link>
                 </div>
              )}
              
              <div className="mt-12 text-center text-[10px] font-black uppercase tracking-widest text-gray-300">
                 Native OS Platform • Modern Savannah
              </div>
           </div>
        </div>
     );
  }

  return (
    <PublicLayout>
      {/* Hero Section */}
      <header className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none"></div>
        <h1 className="relative text-5xl sm:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6">
          Your Shop, <br/> 
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">On Every Screen.</span>
        </h1>
        <p className="relative text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          The simplest way to digitize your menu and handle orders directly. No complex apps, just a scan and a click.
        </p>
        <div className="relative flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/request-access" className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-5 rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-indigo-500/40 transition-all hover:-translate-y-1 active:scale-95">
             Join the Savannah
          </Link>
          <Link to="/pricing" className="w-full sm:w-auto px-10 py-5 rounded-2xl font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all">
             View Plans & Pricing
          </Link>
        </div>
      </header>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white px-4 sm:px-6 lg:px-8 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
           <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="bg-slate-50 rounded-3xl p-8 hover:bg-slate-100 transition-colors border border-slate-200/50">
                 <div className="bg-gradient-to-br from-indigo-100 to-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-indigo-100">
                    <span className="text-2xl">📱</span>
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-3">Direct Ordering</h3>
                 <p className="text-slate-500 leading-relaxed">Orders land directly in your dashboard with high-fidelity customer data, ready for fulfillment.</p>
              </div>
              <div className="bg-slate-50 rounded-3xl p-8 hover:bg-slate-100 transition-colors border border-slate-200/50">
                 <div className="bg-gradient-to-br from-purple-100 to-purple-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-purple-100">
                    <span className="text-2xl">📊</span>
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-3">Real-time Analytics</h3>
                 <p className="text-slate-500 leading-relaxed">Know your top items, peak hours, and revenue trends without complex spreadsheets.</p>
              </div>
              <div className="bg-slate-50 rounded-3xl p-8 hover:bg-slate-100 transition-colors border border-slate-200/50">
                 <div className="bg-gradient-to-br from-emerald-100 to-emerald-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-emerald-100">
                    <span className="text-2xl">💰</span>
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 mb-3">Higher Conversion</h3>
                 <p className="text-slate-500 leading-relaxed">Less friction for customers means more orders. No account required to browse your menu.</p>
              </div>
           </div>
        </div>
      </section>

      {/* Pricing */}


      {/* Pricing */}




      <button 
        onClick={() => setShowScanner(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-theme-secondary text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-theme-main hover:scale-110 transition-all z-50 cursor-pointer border-4 border-white"
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
    </PublicLayout>
  );
}
