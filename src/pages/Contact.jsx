import { Link } from "react-router-dom";
import PublicLayout from "../components/public/PublicLayout";

export default function Contact() {
  return (
    <PublicLayout>
      <main className="max-w-4xl mx-auto px-4 py-20 relative">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none -z-10"></div>
        <header className="mb-16">
           <h1 className="text-5xl font-black text-slate-900 tracking-tighter mb-4 italic">Get in Touch.</h1>
           <p className="text-slate-600 text-lg">We're here to help you scale your commerce node.</p>
        </header>

        <div className="grid md:grid-cols-2 gap-12">
           <div className="space-y-12">
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                 <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs mb-4 flex items-center gap-2"><span className="text-indigo-500">◆</span> Support</h3>
                 <p className="text-slate-500 mb-4 font-medium">Have a technical issue or order question?</p>
                 <a href="https://wa.me/254712345678" className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-bold hover:bg-indigo-100 transition-colors">
                    💬 WhatsApp Support Agent
                 </a>
              </div>
              
              <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                 <h3 className="font-bold text-slate-900 uppercase tracking-widest text-xs mb-4 flex items-center gap-2"><span className="text-purple-500">◆</span> Inquiries</h3>
                 <p className="text-slate-500 mb-4 font-medium">Business partnerships or press.</p>
                 <a href="mailto:hello@tmsavannah.com" className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-4 py-2 rounded-xl font-bold hover:bg-purple-100 transition-colors">
                    📧 hello@tmsavannah.com
                 </a>
              </div>
           </div>

           <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-8 border border-slate-800 shadow-xl text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <h4 className="font-bold text-white mb-4 relative">Visit Our Nodes</h4>
              <p className="text-sm text-slate-300 mb-6 leading-relaxed relative">
                 Modern Savannah operates digitally across the continent, with physical logistics hubs in:
              </p>
              <ul className="space-y-4 text-sm font-medium text-slate-200 relative">
                 <li className="flex items-start gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                    <span className="text-lg">📍</span>
                    <span>Digital Hub: Operations based in Nairobi (Logistics Delivery Only).</span>
                 </li>
              </ul>
           </div>
        </div>
      </main>
    </PublicLayout>
  );
}
