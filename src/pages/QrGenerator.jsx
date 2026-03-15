import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { createQrNode } from "../services/qr-node-service";

export default function QrGenerator() {
  const [location, setLocation] = useState("");
  const [action, setAction] = useState("open_menu");
  const [generating, setGenerating] = useState(false);
  const [createdQr, setCreatedQr] = useState(null);
  const navigate = useNavigate();

  // Mock shop ID for now
  const shopId = "test-shop-id-123";

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
          <div className="w-16"></div>
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
                disabled={generating || !location}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {generating ? "Generating..." : "Generate Smart QR"}
              </button>
            </form>
          </div>
        </div>

        <div>
          {createdQr ? (
            <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center text-center">
               <h3 className="font-bold text-gray-800 mb-2">QR Successfully Generated!</h3>
               <p className="text-sm text-gray-500 mb-6">You can now print this node or download the image.</p>
               
               <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 inline-block mb-6">
                 <QRCodeSVG 
                    value={`${import.meta.env.VITE_GATEWAY_URL || window.location.origin}/q/${createdQr.id}`} 
                    size={200}
                    level="H"
                    includeMargin={true}
                 />
               </div>

               <div className="bg-gray-50 rounded p-4 w-full text-left mb-6 font-mono text-sm break-all border border-gray-200">
                  {`${import.meta.env.VITE_GATEWAY_URL || window.location.origin}/q/${createdQr.id}`}
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
