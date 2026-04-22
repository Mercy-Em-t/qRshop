import { Link } from "react-router-dom";
import Footer from "../components/Footer";

export default function Contact() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-50 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-black text-xl text-safari-green italic">Modern Savannah</Link>
          <Link to="/" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition">Back to Home</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-20">
        <header className="mb-16">
           <h1 className="text-5xl font-black text-gray-900 tracking-tighter mb-4 italic">Get in Touch.</h1>
           <p className="text-gray-600 text-lg">We're here to help you scale your commerce node.</p>
        </header>

        <div className="grid md:grid-cols-2 gap-12">
           <div className="space-y-12">
              <div>
                 <h3 className="font-bold text-gray-900 uppercase tracking-widest text-xs mb-4">Support</h3>
                 <p className="text-gray-500 mb-2 font-medium">Have a technical issue or order question?</p>
                 <a href="https://wa.me/254712345678" className="text-safari-green font-bold hover:underline flex items-center gap-2">
                    💬 WhatsApp Support Agent
                 </a>
              </div>
              
              <div>
                 <h3 className="font-bold text-gray-900 uppercase tracking-widest text-xs mb-4">Inquiries</h3>
                 <p className="text-gray-500 mb-2 font-medium">Business partnerships or press.</p>
                 <a href="mailto:hello@tmsavannah.com" className="text-safari-green font-bold hover:underline">
                    📧 hello@tmsavannah.com
                 </a>
              </div>
           </div>

           <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100">
              <h4 className="font-bold text-gray-900 mb-4">Visit Our Nodes</h4>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                 Modern Savannah operates digitally across the continent, with physical logistics hubs in:
              </p>
              <ul className="space-y-4 text-sm font-medium text-gray-700">
                 <li className="flex items-start gap-2">
                    <span>📍</span>
                                         <span>Digital Hub: Operations based in Nairobi (Logistics Delivery Only).</span>

                 </li>
                 <li className="flex items-start gap-2">
                    <span>📍</span>
                    
                 </li>
              </ul>
           </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
