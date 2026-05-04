import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import { getCurrentUser, logout } from "../services/auth-service";
import { supabase } from "../services/supabase-client";

export default function MarketingStudio() {
  const [searchParams] = useSearchParams();
  const [qrs, setQrs] = useState([]);
  const [selectedQr, setSelectedQr] = useState(null);
  // Read ?tab param so dashboard Bundles link can deep-link to the Promo Bundles tab
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    return ['ads', 'promos', 'appearance'].includes(tabParam) ? tabParam : 'ads';
  });
  
  // Appearance State
  const [appearanceConfig, setAppearanceConfig] = useState({
    layout: ["hero", "categories", "featured_grid", "value_props", "cta"],
    theme: { primary_color: "#6366f1", font_family: "Outfit" }
  });
  const [customCss, setCustomCss] = useState("");
  
  // Customization State (Ads)
  const [headline, setHeadline] = useState("Tap to Order Now! 🍔");
  const [subheading, setSubheading] = useState("Scan to skip the queue.");
  const [theme, setTheme] = useState("dark"); // dark, light, green

  // Promo Bundles State
  const [promotions, setPromotions] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [isCreatingPromo, setIsCreatingPromo] = useState(false);
  const [promoForm, setPromoForm] = useState({
    name: "", description: "", discount_type: "percent", discount_value: 0,
    bundle_price: 0, coupon_code: "", min_items: 1, expires_at: "", is_active: true
  });
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());

  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const user = getCurrentUser();
  const shopId = user?.shop_id;
  const [supplierId, setSupplierId] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    const init = async () => {
      setIsFetching(true);
      try {
        if (!shopId) {
          const { data: supplier } = await supabase.from('suppliers').select('id').eq('owner_id', user.id).single();
          if (supplier) setSupplierId(supplier.id);
        }
        
        await Promise.all([
          fetchQRs(),
          fetchPromotions(),
          fetchProductPool(),
          fetchAppearanceSettings()
        ]);
      } catch (err) {
        console.error("Initialization Failed:", err);
      } finally {
        setIsFetching(false);
      }
    };
    
    init();
  }, [navigate]);

  const fetchQRs = async () => {
    if (!shopId) return; // Suppliers don't have physical QR nodes usually
    const { data } = await supabase.from('qrs').select('*, id:qr_id').eq('shop_id', shopId).eq('status', 'active');
    if (data && data.length > 0) {
      setQrs(data);
      setSelectedQr(data[0]);
    }
  };

  const fetchPromotions = async () => {
    const query = supabase.from('promotions').select('*, promotion_items(*)');
    if (shopId) query.eq('shop_id', shopId);
    else if (supplierId) query.eq('supplier_id', supplierId);
    else return;

    const { data } = await query.order('created_at', { ascending: false });
    if (data) setPromotions(data);
  };

  const fetchAppearanceSettings = async () => {
    if (!shopId) return;
    const { data, error } = await supabase
      .from('shops')
      .select('appearance_config, custom_css')
      .eq('shop_id', shopId)
      .single();
    
    if (data) {
      if (data.appearance_config) setAppearanceConfig(data.appearance_config);
      if (data.custom_css) setCustomCss(data.custom_css);
    }
  };

  const saveAppearance = async () => {
    if (!shopId) return;
    setIsSubmitting(true);
    try {
       const { error } = await supabase
         .from('shops')
         .update({
            appearance_config: appearanceConfig,
            custom_css: customCss
         })
         .eq('shop_id', shopId);
       
       if (error) throw error;
       alert("Appearance settings saved successfully!");
    } catch (err) {
       alert("Failed to save: " + err.message);
    } finally {
       setIsSubmitting(true);
       setIsSubmitting(false);
    }
  };

  const handleCreatePromo = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...promoForm };
      if (shopId) payload.shop_id = shopId;
      else if (supplierId) payload.supplier_id = supplierId;
      else throw new Error("No Shop or Supplier ID associated with your session.");

      if (!payload.coupon_code) delete payload.coupon_code;
      if (payload.expires_at === "") payload.expires_at = null;

      const { data: promo, error } = await supabase.from('promotions').insert(payload).select().single();
      if (error) throw error;

      if (selectedProductIds.size > 0) {
        const itemInserts = Array.from(selectedProductIds).map(pid => {
          const item = { promotion_id: promo.id };
          if (shopId) item.menu_item_id = pid;
          else item.supplier_item_id = pid;
          return item;
        });
        const { error: itemErr } = await supabase.from('promotion_items').insert(itemInserts);
        if (itemErr) throw itemErr;
      }

      alert("Promotion created successfully!");
      setIsCreatingPromo(false);
      setPromoForm({ name: "", description: "", discount_type: "percent", discount_value: 0, bundle_price: 0, coupon_code: "", min_items: 1, expires_at: "", is_active: true });
      setSelectedProductIds(new Set());
      fetchPromotions();
    } catch (err) {
      alert("Failed to create promotion: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePromo = async (promoId, currentStatus) => {
    try {
       const { error } = await supabase.from('promotions').update({ is_active: !currentStatus }).eq('id', promoId);
       if (error) throw error;
       fetchPromotions();
    } catch (err) {
       alert("Failed to update status: " + err.message);
    }
  };

  const handleDeletePromo = async (promoId) => {
    if (!window.confirm("Are you sure you want to delete this promotion?")) return;
    try {
      const { error } = await supabase.from('promotions').delete().eq('id', promoId);
      if (error) throw error;
      fetchPromotions();
    } catch (err) {
      alert("Failed to delete: " + err.message);
    }
  };

  const handleDownload = async () => {
    if (canvasRef.current === null) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(canvasRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `QRShop-WhatsApp-Ad-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate image", err);
      alert("Failed to render image. Try using a different browser.");
    } finally {
      setDownloading(false);
    }
  };

  // Aesthetic mappings based on theme
  const themes = {
    dark: "bg-gray-900 border-gray-800 text-white",
    light: "bg-gray-50 border-gray-200 text-gray-900",
    green: "bg-green-600 border-green-700 text-white"
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/a"
            className="text-green-600 font-medium hover:text-green-700 transition-colors"
          >
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Marketing Studio</h1>
          <div className="flex items-center">
             <button
               onClick={() => { logout(); navigate("/login"); }}
               className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
             >
               Logout
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Tab Switcher */}
        <div className="flex gap-4 mb-8 bg-gray-200 p-1.5 rounded-2xl w-fit mx-auto sm:mx-0 shadow-inner">
          <button 
            onClick={() => setActiveTab("ads")}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'ads' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            📸 WhatsApp Ad Generator
          </button>
          <button 
            onClick={() => setActiveTab("promos")}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'promos' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            🏷️ Promo Bundles
          </button>
          <button 
            onClick={() => setActiveTab("appearance")}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'appearance' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            ✨ Store Appearance
          </button>
        </div>

        {activeTab === 'ads' ? (
          <div className="grid md:grid-cols-[1fr_400px] gap-8 items-start">
            {/* Editor Controls */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-6">WhatsApp Ad Generator</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Headline</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    maxLength={40}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subheading</label>
                  <input
                    type="text"
                    value={subheading}
                    onChange={(e) => setSubheading(e.target.value)}
                    maxLength={60}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Color Setup</label>
                  <div className="flex gap-4">
                     <button onClick={() => setTheme('dark')} className={`flex-1 py-2 rounded-lg font-bold text-sm border-2 ${theme === 'dark' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 bg-white'}`}>Dark Mode</button>
                     <button onClick={() => setTheme('light')} className={`flex-1 py-2 rounded-lg font-bold text-sm border-2 ${theme === 'light' ? 'border-gray-900 bg-gray-50 text-gray-900' : 'border-gray-200 text-gray-600 bg-white'}`}>Clean Light</button>
                     <button onClick={() => setTheme('green')} className={`flex-1 py-2 rounded-lg font-bold text-sm border-2 ${theme === 'green' ? 'border-green-600 bg-green-600 text-white' : 'border-gray-200 text-gray-600 bg-white'}`}>Neon Green</button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Target QR Node</label>
                  {isFetching ? (
                     <p className="text-sm text-gray-500">Loading your nodes...</p>
                  ) : qrs.length === 0 ? (
                     <p className="text-sm text-red-500">You need to generate a QR code first in the QR Manager before creating an ad.</p>
                  ) : (
                    <select
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                      value={selectedQr?.qr_id || selectedQr?.id || ""}
                      onChange={(e) => setSelectedQr(qrs.find(q => (q.qr_id || q.id) === e.target.value))}
                    >
                      {qrs.map(qr => (
                        <option key={qr.qr_id || qr.id} value={qr.qr_id || qr.id}>{qr.location || "Unnamed Node"} ({qr.action})</option>
                      ))}
                    </select>
                  )}
                </div>

                <hr className="border-gray-100" />

                <button
                  onClick={handleDownload}
                  disabled={downloading || !selectedQr}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition disabled:opacity-50 shadow-md flex items-center justify-center gap-2"
                >
                  {downloading ? "Rendering Image..." : "📥 Download WhatsApp Image"}
                </button>
                <p className="text-center text-xs text-gray-400 mt-2">Outputs a high-res 1080x1920 graphic optimized for Stories and Statuses.</p>
              </div>
            </div>

            {/* Live Preview Canvas (Aspect Ratio 9:16) */}
            <div className="flex flex-col items-center">
                <h3 className="font-bold text-gray-400 mb-4 inline-block font-mono text-sm tracking-widest uppercase">Live Preview (9:16)</h3>
                
                <div 
                   className="shadow-2xl rounded-2xl overflow-hidden border-8 border-gray-900 bg-black relative"
                   style={{ width: "360px", height: "640px" }} // Scaled down for UI, but proportional to 1080x1920
                >
                   {/* The actual exportable container */}
                   <div 
                     ref={canvasRef}
                     className={`w-full h-full flex flex-col items-center justify-center p-8 text-center ${themes[theme]}`}
                     style={{
                        backgroundImage: theme === 'dark' ? 'radial-gradient(circle at top right, #1f2937, #111827)' : 
                                      theme === 'green' ? 'radial-gradient(circle at top right, #22c55e, #166534)' : 
                                      'radial-gradient(circle at top right, #ffffff, #f3f4f6)'
                     }}
                   >
                      <div className={`text-4xl font-black mb-4 leading-tight tracking-tight ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
                        {headline || "Your Headline Here"}
                      </div>
                      <div className={`text-lg mb-12 opacity-90 mx-auto max-w-[80%] font-medium ${theme === 'light' ? 'text-gray-600' : 'text-gray-200'}`}>
                        {subheading || "Your promotional subtitle goes perfectly here."}
                      </div>

                      <div className={`p-6 rounded-3xl ${theme === 'light' ? 'bg-white shadow-xl border border-gray-100' : 'bg-white shadow-[0_0_50px_rgba(255,255,255,0.2)]'}`}>
                         {selectedQr ? (
                            <QRCodeSVG 
                              value={`${import.meta.env.VITE_GATEWAY_URL || window.location.origin}/q/${selectedQr.qr_id || selectedQr.id}`} 
                              size={180}
                              level="H"
                              includeMargin={false}
                              fgColor="#111827" 
                            />
                         ) : (
                            <div className="w-[180px] h-[180px] bg-gray-100 flex items-center justify-center rounded-xl text-gray-400">No QR</div>
                         )}
                      </div>
                      
                      <div className="mt-8">
                         <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm ${theme === 'light' ? 'bg-gray-100 text-gray-800' : 'bg-white/10 text-white backdrop-blur-md border border-white/20'}`}>
                            <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                            Scan with your camera
                         </div>
                      </div>

                      <div className="absolute bottom-6 opacity-40 font-bold tracking-widest text-[10px] uppercase font-mono">
                         Powered by QRShop
                      </div>
                   </div>
                </div>
            </div>
          </div>
        ) : activeTab === 'appearance' ? (
          <div className="grid md:grid-cols-[1fr_350px] gap-8">
             <div className="space-y-6">
                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                   <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                      🎨 Brand Theming
                   </h3>
                   <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                         <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Primary Brand Color</label>
                         <div className="flex gap-2">
                            <input 
                               type="color" 
                               value={appearanceConfig.theme?.primary_color || "#6366f1"} 
                               onChange={e => setAppearanceConfig({...appearanceConfig, theme: {...appearanceConfig.theme, primary_color: e.target.value}})}
                               className="w-12 h-12 rounded-xl cursor-pointer border-none p-0"
                            />
                            <input 
                               type="text" 
                               value={appearanceConfig.theme?.primary_color || ""} 
                               onChange={e => setAppearanceConfig({...appearanceConfig, theme: {...appearanceConfig.theme, primary_color: e.target.value}})}
                               className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm uppercase"
                            />
                         </div>
                      </div>
                      <div>
                         <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Typography (Font Family)</label>
                         <select 
                            value={appearanceConfig.theme?.font_family || "Outfit"}
                            onChange={e => setAppearanceConfig({...appearanceConfig, theme: {...appearanceConfig.theme, font_family: e.target.value}})}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                         >
                            <option value="Outfit">Outfit (Modern)</option>
                            <option value="Inter">Inter (Clean)</option>
                            <option value="Roboto">Roboto (Classic)</option>
                            <option value="Playfair Display">Playfair (Elegant)</option>
                            <option value="Montserrat">Montserrat (Bold)</option>
                         </select>
                      </div>
                   </div>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                   <h3 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-2">
                      📝 Page Content (Custom Wordings)
                   </h3>
                   <p className="text-sm text-gray-500 mb-6">Set specific wording for your shop components to make it uniquely yours.</p>
                   
                   <div className="space-y-4">
                      <div>
                         <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Hero Title</label>
                         <input 
                            type="text" 
                            value={appearanceConfig.wordings?.hero_title || ""} 
                            onChange={e => setAppearanceConfig({...appearanceConfig, wordings: {...(appearanceConfig.wordings || {}), hero_title: e.target.value}})}
                            placeholder="e.g. Welcome to Mama Rosy's"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                         />
                      </div>
                      <div>
                         <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Hero Subtitle</label>
                         <input 
                            type="text" 
                            value={appearanceConfig.wordings?.hero_subtitle || ""} 
                            onChange={e => setAppearanceConfig({...appearanceConfig, wordings: {...(appearanceConfig.wordings || {}), hero_subtitle: e.target.value}})}
                            placeholder="e.g. Fresh, Organic, Direct from Farm"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                         />
                      </div>
                   </div>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                   <h3 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-2">
                      🧩 Page Layout (Plugins)
                   </h3>
                   <p className="text-sm text-gray-500 mb-6">Drag components to reorder or click to toggle visibility.</p>
                   
                   <div className="space-y-3">
                      {(appearanceConfig.layout || []).map((section, idx) => (
                         <div key={section} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-2xl group">
                            <div className="flex items-center gap-4">
                               <span className="text-gray-300 group-hover:text-gray-400 cursor-grab">⠿</span>
                               <span className="font-bold text-sm text-gray-700 capitalize">{section.replace('_', ' ')}</span>
                            </div>
                            <div className="flex gap-2">
                               <button 
                                 onClick={() => {
                                    const next = [...appearanceConfig.layout];
                                    if (idx > 0) {
                                       [next[idx], next[idx-1]] = [next[idx-1], next[idx]];
                                       setAppearanceConfig({...appearanceConfig, layout: next});
                                    }
                                 }}
                                 className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                               >↑</button>
                               <button 
                                 onClick={() => {
                                    const next = [...appearanceConfig.layout];
                                    if (idx < next.length - 1) {
                                       [next[idx], next[idx+1]] = [next[idx+1], next[idx]];
                                       setAppearanceConfig({...appearanceConfig, layout: next});
                                    }
                                 }}
                                 className="p-2 hover:bg-white rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                               >↓</button>
                               <button 
                                 onClick={() => {
                                    const next = appearanceConfig.layout.filter(s => s !== section);
                                    setAppearanceConfig({...appearanceConfig, layout: next});
                                 }}
                                 className="p-2 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-500 transition-colors"
                               >✕</button>
                            </div>
                         </div>
                      ))}
                      
                      <div className="pt-4 flex flex-wrap gap-2">
                         {["hero", "categories", "featured_grid", "value_props", "cta", "footer"].filter(s => !appearanceConfig.layout.includes(s)).map(s => (
                            <button 
                               key={s}
                               onClick={() => setAppearanceConfig({...appearanceConfig, layout: [...appearanceConfig.layout, s]})}
                               className="px-4 py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-all"
                            >
                               + Add {s.replace('_', ' ')}
                            </button>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                   <h3 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-2">
                      ⌨️ Custom CSS (Bespoke)
                   </h3>
                   <p className="text-sm text-gray-500 mb-4">Add your own CSS overrides for a pixel-perfect design.</p>
                   <textarea 
                      rows={6}
                      value={customCss}
                      onChange={e => setCustomCss(e.target.value)}
                      placeholder=".hero { background: #000; } ..."
                      className="w-full px-4 py-4 bg-gray-900 text-green-400 font-mono text-xs rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-500"
                   />
                </div>
             </div>

             <div className="sticky top-24 h-fit">
                <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-500/20">
                   <h4 className="font-black text-lg mb-2">Publish Changes</h4>
                   <p className="text-indigo-100 text-sm mb-6">Your store appearance updates in real-time once you save.</p>
                   <button 
                      onClick={saveAppearance}
                      disabled={isSubmitting}
                      className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-50 transition shadow-lg disabled:opacity-50"
                   >
                      {isSubmitting ? "Saving..." : "💾 Save Appearance"}
                   </button>
                </div>
             </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
            {/* Promotions List */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Active Promotions</h2>
                {!isCreatingPromo && (
                  <button 
                    onClick={() => setIsCreatingPromo(true)}
                    className="bg-teal-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-teal-700 transition shadow-sm flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                    New Promo/Bundle
                  </button>
                )}
              </div>

              {promotions.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-100">
                  <span className="text-5xl mb-4 block">🏷️</span>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No active promotions</h3>
                  <p className="text-gray-500 max-w-sm mx-auto">Create bundles, combos, or percentage discounts to drive more sales.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {promotions.map(promo => (
                    <div key={promo.id} className={`bg-white rounded-3xl p-6 border transition-all ${promo.is_active ? 'border-teal-100 shadow-sm' : 'border-gray-100 opacity-60'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-black text-gray-900 text-lg uppercase tracking-tight">{promo.name}</h3>
                            {promo.coupon_code && <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded uppercase tracking-widest border border-indigo-100">CODE: {promo.coupon_code}</span>}
                          </div>
                          <p className="text-sm text-gray-500 mb-4">{promo.description || "No description provided."}</p>
                          
                          <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                            <span className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full uppercase tracking-widest">
                              {promo.discount_type === 'percent' ? `${promo.discount_value}% OFF` : promo.discount_type === 'flat' ? `KSh ${promo.discount_value} OFF` : `Bundle: KSh ${promo.bundle_price}`}
                            </span>
                            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full uppercase tracking-widest">
                              {promo.promotion_items?.length || 0} Products Included
                            </span>
                            {promo.expires_at && (
                              <span className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full uppercase tracking-widest">
                                Expires: {new Date(promo.expires_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                           <button onClick={() => handleTogglePromo(promo.id, promo.is_active)} className={`p-2 rounded-xl border transition-colors ${promo.is_active ? 'bg-teal-50 border-teal-200 text-teal-600' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                              {promo.is_active ? '✅ Active' : '⏸️ Paused'}
                           </button>
                           <button onClick={() => handleDeletePromo(promo.id)} className="p-2 rounded-xl border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                              🗑️ Delete
                           </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Creation Side Panel / Modal Overlay */}
            <div className={`space-y-6 ${isCreatingPromo ? 'block' : 'hidden lg:block lg:opacity-30'}`}>
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sticky top-24">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">Product Bundle Builder</h2>
                    {isCreatingPromo && <button onClick={() => setIsCreatingPromo(false)} className="text-gray-400 hover:text-gray-600">✕</button>}
                  </div>

                  <form onSubmit={handleCreatePromo} className="space-y-5">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Bundle/Promo Name</label>
                      <input 
                        type="text" 
                        required
                        value={promoForm.name}
                        onChange={e => setPromoForm({...promoForm, name: e.target.value})}
                        placeholder="e.g. Weekend Burger Combo"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Discount Type</label>
                      <div className="grid grid-cols-3 gap-2">
                         <button type="button" onClick={() => setPromoForm({...promoForm, discount_type: 'percent'})} className={`py-2 rounded-lg text-xs font-bold border-2 transition-all ${promoForm.discount_type === 'percent' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-100'}`}>Percent %</button>
                         <button type="button" onClick={() => setPromoForm({...promoForm, discount_type: 'flat'})} className={`py-2 rounded-lg text-xs font-bold border-2 transition-all ${promoForm.discount_type === 'flat' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-100'}`}>Flat KSh</button>
                         <button type="button" onClick={() => setPromoForm({...promoForm, discount_type: 'bundle_price'})} className={`py-2 rounded-lg text-xs font-bold border-2 transition-all ${promoForm.discount_type === 'bundle_price' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-100'}`}>Bundle Fix</button>
                      </div>
                    </div>

                    {promoForm.discount_type === 'bundle_price' ? (
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Fixed Bundle Price (KSh)</label>
                        <input type="number" value={promoForm.bundle_price} onChange={e => setPromoForm({...promoForm, bundle_price: parseFloat(e.target.value)})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold" />
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">{promoForm.discount_type === 'percent' ? 'Percentage Value %' : 'Flat Amount (KSh)'}</label>
                        <input type="number" required value={promoForm.discount_value} onChange={e => setPromoForm({...promoForm, discount_value: parseFloat(e.target.value)})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm font-bold" />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 flex justify-between">
                        <span>Select Products</span>
                        <span className="text-teal-600 normal-case">{selectedProductIds.size} selected</span>
                      </label>
                      <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-xl p-2 space-y-1 bg-gray-50/50">
                         {menuItems.map(item => (
                           <label key={item.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white transition cursor-pointer border border-transparent hover:border-gray-200">
                             <input 
                               type="checkbox" 
                               checked={selectedProductIds.has(item.id)}
                               onChange={() => {
                                 const next = new Set(selectedProductIds);
                                 if (next.has(item.id)) next.delete(item.id);
                                 else next.add(item.id);
                                 setSelectedProductIds(next);
                               }}
                               className="accent-teal-600 w-4 h-4" 
                             />
                             <div className="flex-1 min-w-0">
                               <p className="text-xs font-bold text-gray-800 truncate">{item.name}</p>
                               <p className="text-[10px] text-gray-400">KSh {item.price}</p>
                             </div>
                           </label>
                         ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Coupon Code (Opt)</label>
                        <input type="text" value={promoForm.coupon_code} onChange={e => setPromoForm({...promoForm, coupon_code: e.target.value.toUpperCase().replace(/\s/g, '')})} placeholder="SAVE20" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-xs font-mono font-bold" />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Target Bundle Size</label>
                        <input type="number" min="1" value={promoForm.min_items} onChange={e => setPromoForm({...promoForm, min_items: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none text-sm font-bold" />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmitting || (selectedProductIds.size === 0 && promoForm.discount_type === 'bundle_price')}
                      className="w-full bg-black text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-800 transition shadow-lg disabled:opacity-50"
                    >
                      {isSubmitting ? 'Creating...' : '🚀 Launch This Promotion'}
                    </button>
                  </form>
                </div>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
