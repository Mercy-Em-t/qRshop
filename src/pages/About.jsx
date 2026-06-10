import { Link } from "react-router-dom";
import PublicLayout from "../components/public/PublicLayout";

export default function About() {
  return (
    <PublicLayout>
      <main className="max-w-4xl mx-auto px-4 py-20 relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>
        <header className="mb-16">
           <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 font-black tracking-widest uppercase text-xs">Our Mission</span>
           <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter mt-4 mb-8 italic">Africa to the World.</h1>
           <p className="text-xl text-slate-600 leading-relaxed font-light">
             Modern Savannah is a tech-driven Commerce OS designed for the expansive, vibrant, and multi-layered trade ecosystems of Africa. We believe that technology should be native—built for the way people actually trade, communicate, and grow.
           </p>
        </header>

         <section className="grid md:grid-cols-2 gap-12 mb-20">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
               <h3 className="font-bold text-xl text-slate-900 mb-4 tracking-tight flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm">🌍</span> 
                  Expansive Reach
               </h3>
               <p className="text-slate-500 leading-relaxed">
                 From the busiest streets of Nairobi to the growing hubs of Mombasa and beyond, we provide the digital infrastructure for shops, suppliers, and service providers to connect seamlessly.
              </p>
           </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
               <h3 className="font-bold text-xl text-slate-900 mb-4 tracking-tight flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-sm">⚡</span> 
                  Native Technology
               </h3>
               <p className="text-slate-500 leading-relaxed">
                 We don't just build apps; we build "Nodes." Our platform integrates natively with M-Pesa, WhatsApp, and physical QR touchpoints to ensure zero friction for the end customer.
              </p>
           </div>
        </section>

         <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <h2 className="relative text-3xl md:text-4xl font-black text-white mb-6 tracking-tighter italic">Join the Movement</h2>
            <p className="relative text-slate-300 mb-8 max-w-md mx-auto">Digitize your trade. Own your data. Expand your horizon.</p>
            <Link to="/request-access" className="relative inline-block bg-white text-indigo-950 font-black px-10 py-4 rounded-full shadow-lg hover:shadow-white/20 transition-all transform hover:-translate-y-1">
               Apply for Merchant Access
            </Link>
         </div>
      </main>
    </PublicLayout>
  );
}
