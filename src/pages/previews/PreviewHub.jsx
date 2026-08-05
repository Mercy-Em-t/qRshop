import { Link, useNavigate } from "react-router-dom";
import MetaTags from "../../components/MetaTags";

export default function PreviewHub() {
  const navigate = useNavigate();

  const previewRoutes = [
    {
      category: "Public Routes (Customer Facing)",
      description: "Pages that customers see before logging in or checking out.",
      items: [
        { name: "Product Details Page", path: "/previews/product-details", icon: "🛍️", status: "New Design" },
        { name: "Public Shop Profile", path: "/s/demo", icon: "🏪", status: "Live" },
        { name: "Public QR Landing", path: "/qr/demo", icon: "📱", status: "Live" },
        { name: "Cart & Checkout", path: "/cart", icon: "🛒", status: "Live" }
      ]
    },
    {
      category: "Protected Routes (Admin / Operator)",
      description: "Pages hidden behind authentication for shop owners.",
      items: [
        { name: "Admin Dashboard", path: "/a/admin", icon: "📊", status: "Live" },
        { name: "Product Manager", path: "/a/products", icon: "📝", status: "Live" },
        { name: "Settings & Finances", path: "/a/settings", icon: "⚙️", status: "Live" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800">
      <MetaTags title="Component Preview Hub" />

      {/* Header */}
      <header className="sticky top-0 bg-white/70 backdrop-blur-md z-40 border-b border-slate-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <button
               onClick={() => navigate("/")}
               className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:text-emerald-600 hover:border-emerald-200 transition shadow-sm"
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
               </svg>
             </button>
             <h1 className="text-xl font-black tracking-tight text-slate-900">Preview Hub</h1>
          </div>
          <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-200">
            Development Mode
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 pt-10">
        <div className="mb-10 text-center space-y-3">
           <h2 className="text-4xl font-black text-slate-900 tracking-tight">Component Gallery</h2>
           <p className="text-slate-500 font-medium max-w-lg mx-auto">
             A dedicated sandbox to preview pages with simulated data exactly as they would appear to live users. 
           </p>
        </div>

        <div className="space-y-12">
          {previewRoutes.map((group, idx) => (
            <section key={idx}>
              <div className="mb-6">
                 <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">{group.category}</h3>
                 <p className="text-xs font-bold text-slate-400 mt-1">{group.description}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {group.items.map((item, i) => (
                  <Link 
                    key={i} 
                    to={item.path}
                    className="group bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition hover:border-emerald-300 relative overflow-hidden"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{item.name}</h4>
                        <p className="text-xs text-slate-400 font-medium mt-0.5 font-mono">{item.path}</p>
                      </div>
                    </div>
                    {item.status === "New Design" && (
                      <span className="absolute top-4 right-4 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full shadow-sm">
                        New
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
