import { Link } from "react-router-dom";
import Footer from "../components/Footer";

export default function Advertise() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-50 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-black text-xl text-safari-green italic">Modern Savannah</Link>
          <Link to="/" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition">Back to Home</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-20 text-center">
        <header className="mb-16">
           <span className="text-safari-green font-black tracking-widest uppercase text-xs">Monetization Hub</span>
           <h1 className="text-5xl font-black text-gray-900 tracking-tighter mt-4 mb-8 italic">The Modern Savannah Ad Network.</h1>
           <p className="text-xl text-gray-600 leading-relaxed font-light max-w-2xl mx-auto">
             Put your brand in front of native shoppers exactly when they are looking to buy. High-intent, regional placements that drive growth.
           </p>
        </header>

        <div className="grid md:grid-cols-3 gap-8 mb-20 text-left">
           <div className="border border-gray-100 p-8 rounded-3xl bg-gray-50/50">
              <span className="text-3xl mb-4 block">🔝</span>
              <h3 className="font-bold text-gray-900 mb-2">Header Banners</h3>
              <p className="text-sm text-gray-500">Premium visibility at the top of the Marketplace. Perfect for brand launches.</p>
           </div>
           <div className="border border-gray-100 p-8 rounded-3xl bg-gray-50/50">
              <span className="text-3xl mb-4 block">📱</span>
              <h3 className="font-bold text-gray-900 mb-2">In-Feed Native</h3>
              <p className="text-sm text-gray-500">Subtle, context-aware ads that appear between shop cards in the discovery feed.</p>
           </div>
           <div className="border border-gray-100 p-8 rounded-3xl bg-gray-50/50">
              <span className="text-3xl mb-4 block">📍</span>
              <h3 className="font-bold text-gray-900 mb-2">Regional Target</h3>
              <p className="text-sm text-gray-500">Only show your ads to users in specific regions (e.g., Kilimani only).</p>
           </div>
        </div>

        <div className="max-w-xl mx-auto bg-safari-green p-1 justify-center rounded-3xl overflow-hidden shadow-2xl">
           <div className="bg-white p-12 rounded-[22px]">
              <h2 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Ready to launch?</h2>
              <p className="text-gray-500 mb-8">Contact our campaign team to get your ads live in the Savannah.</p>
              <a href="mailto:ads@tmsavannah.com" className="bg-safari-green text-white font-bold px-10 py-4 rounded-full inline-block hover:scale-105 transition-transform">
                 Contact Ads Specialist
              </a>
           </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
