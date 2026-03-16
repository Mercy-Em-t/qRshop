import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";
import { getCurrentUser } from "../services/auth-service";
import { supabase } from "../services/supabase-client";

export default function MarketingStudio() {
  const [qrs, setQrs] = useState([]);
  const [selectedQr, setSelectedQr] = useState(null);
  
  // Customization State
  const [headline, setHeadline] = useState("Tap to Order Now! 🍔");
  const [subheading, setSubheading] = useState("Scan to skip the queue.");
  const [theme, setTheme] = useState("dark"); // dark, light, green

  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const user = getCurrentUser();
  const shopId = user?.shop_id;

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchQRs();
  }, [navigate]);

  const fetchQRs = async () => {
    setLoading(true);
    const { data } = await supabase.from('qrs').select('*').eq('shop_id', shopId).eq('status', 'active');
    if (data && data.length > 0) {
      setQrs(data);
      setSelectedQr(data[0]);
    }
    setLoading(false);
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
            to="/dashboard"
            className="text-green-600 font-medium hover:text-green-700 transition-colors"
          >
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Marketing Studio</h1>
          <div className="w-24"></div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-[1fr_400px] gap-8 items-start">
        
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
              {loading ? (
                 <p className="text-sm text-gray-500">Loading your nodes...</p>
              ) : qrs.length === 0 ? (
                 <p className="text-sm text-red-500">You need to generate a QR code first in the QR Manager before creating an ad.</p>
              ) : (
                <select
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  value={selectedQr?.id || ""}
                  onChange={(e) => setSelectedQr(qrs.find(q => q.id === e.target.value))}
                >
                  {qrs.map(qr => (
                    <option key={qr.id} value={qr.id}>{qr.location || "Unnamed Node"} ({qr.action})</option>
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
                    // Adding a subtle radial gradient overlay natively inside the canvas
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
                          value={`${import.meta.env.VITE_GATEWAY_URL || window.location.origin}/q/${selectedQr.id}`} 
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

                  {/* Tiny branding watermark at bottom */}
                  <div className="absolute bottom-6 opacity-40 font-bold tracking-widest text-[10px] uppercase font-mono">
                     Powered by QRShop
                  </div>
               </div>
            </div>
        </div>

      </main>
    </div>
  );
}
