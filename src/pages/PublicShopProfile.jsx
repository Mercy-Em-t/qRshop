import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getShop } from "../services/shop-service";
import { getMenuItemsByCategory } from "../services/menu-service";
import { useNomenclature } from "../hooks/use-nomenclature";
import MetaTags from "../components/MetaTags";
import { ShoppingBag, ChevronRight, Info, MapPin, Phone, ArrowLeft } from "lucide-react";

export default function PublicShopProfile({ directShopId }) {
  const params = useParams();
  const navigate = useNavigate();
  const shopId = directShopId || params.shopId;
  const [shop, setShop] = useState(null);
  const [menuCategories, setMenuCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  
  const terms = useNomenclature(shopId);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    async function loadShop() {
      try {
        const shopData = await getShop(shopId);
        if (!shopData) {
          setError("Shop not found");
          return;
        }
        setShop(shopData);
        const menuData = await getMenuItemsByCategory(shopId);
        setMenuCategories(menuData || {});
      } catch (err) {
        setError("Failed to load shop profile.");
      } finally {
        setLoading(false);
      }
    }
    loadShop();
  }, [shopId]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      <p className="mt-4 text-gray-400 font-medium scale-in">Loading Storefront...</p>
    </div>
  );
  
  if (error || !shop) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <div className="text-6xl mb-4">🏪</div>
      <h1 className="text-3xl font-black text-gray-900">Storefront Not Found</h1>
      <p className="text-gray-500 mt-2">The shop you are looking for doesn't exist or has moved.</p>
      <Link to="/" className="mt-8 bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all">Go Home</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-green-100 selection:text-green-900">
      <MetaTags 
        title={`${shop.name} | Modern Savannah`} 
        description={shop.tagline || "Shop online via WhatsApp"} 
      />

      {/* Floating Glass Nav */}
      <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 px-4 py-4 ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-gray-100 py-3 shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className={`p-2.5 rounded-full transition-all flex items-center gap-2 group ${scrolled ? 'text-gray-900 bg-gray-50 hover:bg-gray-100' : 'text-white bg-black/20 backdrop-blur-md border border-white/20 hover:bg-black/30'}`}
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-bold pr-2">Back</span>
          </button>
          
          <div className={`overflow-hidden transition-all duration-300 ${scrolled ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'}`}>
             <h2 className="font-black text-lg tracking-tight">{shop.name}</h2>
          </div>

          <div className="flex gap-2">
            <Link 
              to="/auto-cart"
              className={`p-2.5 rounded-full transition-all relative ${scrolled ? 'text-gray-900 bg-gray-50' : 'text-white bg-black/20 backdrop-blur-md border border-white/20'}`}
            >
              <ShoppingBag className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with Glassmorphism Overlay */}
      <header className="relative min-h-[50vh] flex flex-col justify-end pb-12 pt-32 px-4 overflow-hidden bg-gray-900">
        <div className="absolute inset-0 z-0">
           <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent z-10" />
           <div className="absolute inset-x-0 top-0 h-96 bg-green-600/20 blur-3xl opacity-50 translate-y--1/2" />
        </div>

        <div className="max-w-5xl mx-auto w-full relative z-20">
           <div className="space-y-4">
              <div className="flex items-center gap-4">
                 <div className="w-20 h-20 bg-white shadow-2xl rounded-2xl flex items-center justify-center text-3xl font-black text-green-600 border-4 border-white/10 scale-in">
                   {shop.name.charAt(0).toUpperCase()}
                 </div>
                 {shop.verification_level === 'gold' && (
                    <span className="bg-yellow-400/90 backdrop-blur-md text-gray-900 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                       Verified Gold
                    </span>
                 )}
              </div>
              
              <div className="space-y-1">
                 <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">{shop.name}</h1>
                 <p className="text-lg text-gray-400 font-medium max-w-xl">{shop.tagline || "Experience modern shopping curated for your lifestyle."}</p>
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                 <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-gray-200 text-sm">
                    <MapPin className="w-4 h-4 text-green-400" />
                    <span>{shop.address || "Digital Presence"}</span>
                 </div>
                 <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-gray-200 text-sm">
                    <Phone className="w-4 h-4 text-green-400" />
                    <span>{shop.phone || "Connect Online"}</span>
                 </div>
              </div>
           </div>
        </div>
      </header>

      {/* Category Navigation (Sticky Tabs) */}
      <div className="sticky top-[72px] z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-3 overflow-x-auto scrollbar-hide">
         <div className="max-w-5xl mx-auto flex gap-6 no-wrap items-center">
            {Object.keys(menuCategories).map(cat => (
               <a 
                 key={cat} 
                 href={`#cat-${cat.replace(/\s+/g, '-').toLowerCase()}`}
                 className="whitespace-nowrap text-sm font-bold text-gray-500 hover:text-green-600 transition-colors"
               >
                 {cat}
               </a>
            ))}
         </div>
      </div>

      {/* Menu / Catalog Section */}
      <main className="max-w-5xl mx-auto px-4 py-12 pb-32">
        {Object.keys(menuCategories).length === 0 ? (
          <div className="bg-gray-50 p-16 rounded-3xl text-center border-2 border-dashed border-gray-200">
            <span className="text-5xl block mb-4">📦</span>
            <h3 className="text-xl font-bold text-gray-900">Catalog is being updated</h3>
            <p className="text-gray-500 mt-2">Come back in a few moments to see our latest drops.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {Object.keys(menuCategories).map((cat) => (
              <section key={cat} id={`cat-${cat.replace(/\s+/g, '-').toLowerCase()}`}>
                <div className="flex items-center gap-3 mb-8">
                   <div className="h-8 w-1 bg-green-500 rounded-full" />
                   <h3 className="text-2xl font-black text-gray-900 tracking-tight">{cat}</h3>
                </div>
                
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {menuCategories[cat].map((item) => (
                    <div 
                      key={item.id} 
                      className="group relative bg-white p-5 rounded-3xl transition-all duration-300 hover:shadow-2xl hover:shadow-gray-200/50 border border-gray-100 hover:border-green-100 overflow-hidden"
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-gray-900 text-lg pr-8">{item.name}</h4>
                          <Link 
                            to={`/buy/${encodeURIComponent(item.name)}`}
                            className="bg-green-50 text-green-600 p-2 rounded-xl group-hover:bg-green-600 group-hover:text-white transition-all shadow-sm"
                          >
                             <ShoppingBag className="w-5 h-5" />
                          </Link>
                        </div>
                        
                        <p className="text-2xl font-black text-gray-900">
                           KSh {Number(item.price).toLocaleString()}
                        </p>
                        
                        <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px] leading-relaxed italic">
                           {item.description || "No description provided."}
                        </p>
                        
                        <div className="flex items-center justify-between pt-2">
                           <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order on WhatsApp</span>
                           <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-green-500 transition-colors" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
      
      {/* Bottom Legal / Referral Bar */}
      <footer className="bg-gray-900 text-white py-20 px-4 text-center">
         <div className="max-w-2xl mx-auto space-y-8">
            <div className="bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-white/10">
               <h4 className="text-2xl font-black mb-2">Ready to scale?</h4>
               <p className="text-gray-400 mb-6">Join {shop.name} and hundreds of other businesses on the Modern Savannah platform.</p>
               <Link 
                 to="/request-access" 
                 className="inline-block bg-white text-gray-900 px-10 py-4 rounded-2xl font-black hover:bg-green-400 hover:text-gray-900 transition-all shadow-xl"
               >
                 Create Your Shop Free
               </Link>
            </div>
            
            <div className="flex gap-8 justify-center items-center text-xs font-bold text-gray-500 uppercase tracking-widest">
               <Link to="/terms" className="hover:text-white transition">Terms</Link>
               <Link to="/privacy" className="hover:text-white transition">Privacy</Link>
               <Link to="/contact" className="hover:text-white transition">Contact Platform</Link>
            </div>
         </div>
      </footer>
    </div>
  );
}
