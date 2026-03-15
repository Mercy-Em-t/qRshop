import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQRs } from "../hooks/useQRs";
import QRList from "../components/QRList";
import LoadingSpinner from "../components/LoadingSpinner";
import OfflineAlert from "../components/OfflineAlert";

export default function QrDashboard() {
  const shopId = "11111111-1111-1111-1111-111111111111"; // Auth fallback
  const { qrs, loading, updateQR, deleteQR } = useQRs(shopId);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="text-green-600 font-medium hover:text-green-700 transition-colors"
          >
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold text-gray-800">QR Manager</h1>
          <div className="w-24 flex justify-end">
             <Link
              to="/qr-generator"
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
             >
               + Deploy QR
             </Link>
          </div>
        </div>
      </header>

      {!isOnline && (
        <OfflineAlert message="You are viewing remotely cached nodes. Reconnect to make changes." />
      )}

      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        {loading ? (
          <LoadingSpinner message="Syncing Nodes..." />
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative">
            <div className="mb-6 flex justify-between items-center border-b border-gray-100 pb-4">
               <h2 className="text-xl font-semibold text-gray-800">Deployed Fleet / Actions</h2>
               <span className="bg-gray-100 text-gray-700 py-1 px-3 rounded-full text-sm font-bold shadow-inner">
                 {qrs?.length || 0} Nodes
               </span>
            </div>
            
            <QRList qrs={qrs} updateQR={updateQR} deleteQR={deleteQR} />
            
          </div>
        )}
      </main>
    </div>
  );
}
