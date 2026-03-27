import { Link } from "react-router-dom";
import Footer from "../components/Footer";

export default function About() {
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
           <span className="text-savannah-ochre font-black tracking-widest uppercase text-xs">Our Mission</span>
           <h1 className="text-5xl font-black text-gray-900 tracking-tighter mt-4 mb-8 italic">Africa to the World.</h1>
           <p className="text-xl text-gray-600 leading-relaxed font-light">
             Modern Savannah is a tech-driven Commerce OS designed for the expansive, vibrant, and multi-layered trade ecosystems of Africa. We believe that technology should be native—built for the way people actually trade, communicate, and grow.
           </p>
        </header>

        <section className="grid md:grid-cols-2 gap-12 mb-20">
           <div>
              <h3 className="font-bold text-xl text-gray-900 mb-4 tracking-tight">Expansive Reach</h3>
              <p className="text-gray-500 leading-relaxed">
                 From the busiest streets of Nairobi to the growing hubs of Mombasa and beyond, we provide the digital infrastructure for shops, suppliers, and service providers to connect seamlessly.
              </p>
           </div>
           <div>
              <h3 className="font-bold text-xl text-gray-900 mb-4 tracking-tight">Native Technology</h3>
              <p className="text-gray-500 leading-relaxed">
                 We don't just build apps; we build "Nodes." Our platform integrates natively with M-Pesa, WhatsApp, and physical QR touchpoints to ensure zero friction for the end customer.
              </p>
           </div>
        </section>

        <div className="bg-gray-50 rounded-3xl p-12 text-center">
           <h2 className="text-3xl font-black text-gray-900 mb-6 tracking-tighter italic">Join the Movement</h2>
           <p className="text-gray-600 mb-8 max-w-md mx-auto">Digitize your trade. Own your data. Expand your horizon.</p>
           <Link to="/request-access" className="inline-block bg-safari-green text-white font-bold px-10 py-4 rounded-full shadow-lg hover:shadow-green-100 transition-all transform hover:-translate-y-1">
              Apply for Merchant Access
           </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
