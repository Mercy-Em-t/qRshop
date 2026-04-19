import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import { Scanner } from "@yudiel/react-qr-scanner";

export default function PlatformOverview() {
  const [showScanner, setShowScanner] = useState(false);
  const [isUnknownSubdomain, setIsUnknownSubdomain] = useState(false);

  useEffect(() => {
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
          <Link to="/"><Logo /></Link>
          <div className="hidden md:flex gap-8 items-center text-sm font-bold text-gray-500">
            <Link to="/" className="hover:text-green-600 transition">Home</Link>
            <a href="#features" className="hover:text-green-600 transition">Features</a>
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
          <span className="text-green-600">The Modern Savannah.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          The simplest way to digitize your menu and handle orders directly on WhatsApp. No complex apps, just a scan and a chat.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/request-access" className="w-full sm:w-auto bg-green-600 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-green-700 transition shadow-2xl shadow-green-600/30 hover:-translate-y-1 active:scale-95">
             Get Started Free
          </Link>
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
                 <h3 className="text-xl font-bold text-gray-900 mb-3">Expansive Discovery</h3>
                 <p className="text-gray-500">Enable customers to discover your shop across the entire Savannah ecosystem instantly.</p>
              </div>
           </div>
        </div>
      </section>

      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto bg-green-600 rounded-[3rem] text-white overflow-hidden relative shadow-2xl shadow-green-600/20">
         <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
         <div className="relative z-10 text-center py-12">
            <h2 className="text-4xl sm:text-5xl font-black mb-6">Join the Ecosystem.</h2>
            <p className="text-green-50 text-xl max-w-2xl mx-auto mb-10">
               Whether you're a small stall or a regional chain, Modern Savannah provides the digital infrastructure to scale without boundaries.
            </p>
            <Link to="/request-access" className="inline-block bg-white text-green-600 px-12 py-5 rounded-2xl font-black text-lg hover:bg-green-50 transition shadow-xl">
               Apply for Access
            </Link>
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
           
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">© 2026 The Modern Savannah. All rights reserved.</p>
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
              <p className="mt-8 text-center text-white/50 font-black uppercase tracking-widest text-xs">Scan any Modern Savannah Menu</p>
           </div>
        </div>
      )}
    </div>
  );
}
