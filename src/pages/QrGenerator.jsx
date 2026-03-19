import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { createQrNode } from "../services/qr-node-service";
import { getCurrentUser, logout } from "../services/auth-service";
import { supabase } from "../services/supabase-client";
import usePlanAccess from "../hooks/usePlanAccess";
import { useQRs } from "../hooks/useQRs";

const FREE_QR_LIMIT = 2;
const BASIC_QR_LIMIT = 10;

export default function QrGenerator() {
  const [location, setLocation] = useState("");
  const [action, setAction] = useState("open_menu");
  const [generating, setGenerating] = useState(false);
  const [createdQr, setCreatedQr] = useState(null);
  const [shopSubdomain, setShopSubdomain] = useState("");
  const navigate = useNavigate();

  const user = getCurrentUser();
  const shopId = user?.shop_id;

  const { isFree, isBasic, isPro, loading: planLoading } = usePlanAccess();
  const { qrs, loading: qrsLoading } = useQRs(shopId);

  const currentCount = (qrs || []).length;
  const isLimitReached = isPro
    ? false
    : isBasic
      ? currentCount >= BASIC_QR_LIMIT
      : currentCount >= FREE_QR_LIMIT; // Free tier

  useEffect(() => {
    if (!user) {
       navigate('/login');
       return;
    }
    
    if (shopId) {
       supabase.from("shops").select("subdomain").eq("id", shopId).single()
         .then(({ data }) => {
            if (data?.subdomain) setShopSubdomain(data.subdomain);
         });
    }
  }, [user, navigate, shopId]);

  const qrLink = createdQr ? (
     shopSubdomain 
        ? `https://${shopSubdomain}.tmsavannah.com/q/${createdQr.id}`
        : `${import.meta.env.VITE_GATEWAY_URL || window.location.origin}/q/${createdQr.id}`
  ) : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const node = await createQrNode(shopId, location, action);
      setCreatedQr(node);
      
      // Clear form after success
      setLocation("");
      setAction("open_menu");
    } catch (err) {
      console.error("Failed to generate QR:", err);
      alert("Failed to create QR node. Ensure Supabase is connected.");
    } finally {
      setGenerating(false);
    }
  };

  const qrRef = useRef(null);

  const handleDownloadQR = () => {
     if (!qrRef.current) return;
     const svg = qrRef.current.querySelector("svg");
     if (!svg) return;

     const svgData = new XMLSerializer().serializeToString(svg);
     const canvas = document.createElement("canvas");
     const ctx = canvas.getContext("2d");
     const img = new Image();

     // Brand details
     const brandText = shopSubdomain ? `${shopSubdomain}.tmsavannah.com` : "ShopQR Gateway";

     img.onload = () => {
        // Dimensions
        const width = 800;
        const qrSize = 600;
        const height = 900; // Add space at bottom for text
        canvas.width = width;
        canvas.height = height;

        // Draw background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        // Draw QR
        const qrX = (width - qrSize) / 2;
        const qrY = 100;
        ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

        // Draw branding text
        ctx.fillStyle = "#1f2937"; // gray-800
        ctx.font = "bold 40px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(brandText, width / 2, height - 80);
        
        // Draw subtext
        ctx.fillStyle = "#6b7280"; // gray-500
        ctx.font = "24px sans-serif";
        ctx.fillText(`Node: ${createdQr?.location || "Touchpoint"}`, width / 2, height - 40);

        // Trigger download
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `ShopQR_${shopSubdomain || 'Node'}_${createdQr?.id.substring(0,8)}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
     };

     img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/dashboard/qrs"
            className="text-green-600 font-medium hover:text-green-700 transition-colors"
          >
            ← QRs
          </Link>
          <h1 className="text-xl font-bold text-gray-800">QR Factory</h1>
          <div className="flex items-center hidden sm:flex">
             <button
               onClick={() => { logout(); navigate("/login"); }}
               className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
             >
               Logout
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
        <div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Create New Node</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                   Deploy Location (e.g. Table 12, Main Entrance)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Table 12"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                   Node Action
                </label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                >
                  <option value="open_menu">Open Digital Menu</option>
                  <option value="open_order">Open Direct to Cart</option>
                  <option value="open_campaign">Show Promotional Campaign</option>
                  <option value="open_loyalty">Open Loyalty Sign-up</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={generating || !location || isLimitReached || planLoading || qrsLoading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {generating ? "Generating..." : "Generate Smart QR"}
              </button>
            </form>

            {isLimitReached && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-800">
                <p className="font-bold flex items-center gap-1">
                   <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                   {isBasic ? 'Basic Plan Limit Reached' : 'Free Plan Limit Reached'}
                </p>
                <p className="mt-1">
                  {isBasic
                    ? `You've deployed all ${BASIC_QR_LIMIT} QR nodes allowed on the Basic plan. Upgrade to Pro for unlimited nodes.`
                    : `You have deployed the maximum of ${FREE_QR_LIMIT} free nodes. Upgrade to Basic or Pro for more QR touchpoints.`
                  }
                </p>
                <Link to="/plans" className="inline-block mt-2 font-bold text-orange-900 hover:underline">View Upgrade Plans →</Link>
              </div>
            )}
          </div>
        </div>

        <div>
          {createdQr ? (
            <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center text-center">
               <h3 className="font-bold text-gray-800 mb-2">QR Successfully Generated!</h3>
               <p className="text-sm text-gray-500 mb-6">You can now print this node or download the image.</p>
               
               <div ref={qrRef} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 inline-block mb-6">
                 <QRCodeSVG 
                    value={qrLink} 
                    size={200}
                    level="H"
                    includeMargin={true}
                 />
               </div>

               <div className="bg-gray-50 rounded p-4 w-full text-left mb-6 font-mono text-sm break-all border border-gray-200">
                  {qrLink}
               </div>

               <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mb-6">
                 <button 
                    onClick={handleDownloadQR}
                    className="bg-indigo-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-indigo-700 shadow-sm flex items-center justify-center gap-2"
                 >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                   Download Print Asset
                 </button>
               </div>

               <button 
                  onClick={() => navigate("/dashboard/qrs")}
                  className="text-green-600 font-medium hover:text-green-700"
               >
                 View in Dashboard →
               </button>
            </div>
          ) : (
             <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-xl p-8 bg-gray-50/50">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
               </svg>
               <p className="font-medium">Fill in the form to generate a QR.</p>
             </div>
          )}
        </div>
      </main>
    </div>
  );
}
