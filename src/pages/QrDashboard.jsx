import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQRs } from "../hooks/useQRs";
import { useCampaigns } from "../hooks/useCampaigns";
import QRList from "../components/QRList";
import LoadingSpinner from "../components/LoadingSpinner";
import OfflineAlert from "../components/OfflineAlert";
import { getCurrentUser, logout } from "../services/auth-service";

export default function QrDashboard() {
  const user = getCurrentUser();
  const shopId = user?.shop_id;
  const { qrs, loading: qrsLoading, updateQR, deleteQR } = useQRs(shopId);
  const { campaigns, loading: campaignsLoading } = useCampaigns(shopId);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Dashboard Filters
  const [filterCampaign, setFilterCampaign] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const filteredQRs = qrs?.filter(qr => {
    if (filterStatus !== "all" && qr.status !== filterStatus) return false;
    if (filterCampaign !== "all") {
      if (filterCampaign === "unlinked" && qr.campaign_id) return false;
      if (filterCampaign !== "unlinked" && qr.campaign_id !== filterCampaign) return false;
    }
    return true;
  }) || [];

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterCampaign]);

  const totalPages = Math.ceil(filteredQRs.length / itemsPerPage);
  const paginatedQRs = filteredQRs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
          <div className="flex items-center gap-4 hidden sm:flex">
             <Link
              to="/qr-generator"
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
             >
               + Deploy QR
             </Link>
             <button
               onClick={() => { logout(); navigate("/login"); }}
               className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
             >
               Logout
             </button>
          </div>
        </div>
      </header>

      {!isOnline && (
        <OfflineAlert message="You are viewing remotely cached nodes. Reconnect to make changes." />
      )}

      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        {qrsLoading || campaignsLoading ? (
          <LoadingSpinner message="Syncing Nodes and Campaigns..." />
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative">
            <div className="mb-6 flex flex-col md:flex-row md:justify-between items-start md:items-center space-y-4 md:space-y-0 border-b border-gray-100 pb-4">
               <div>
                 <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
                   Deployed Fleet
                   <span className="bg-gray-100 text-gray-700 py-0.5 px-3 rounded-full text-sm font-bold shadow-inner">
                     {filteredQRs.length} Nodes
                   </span>
                 </h2>
               </div>
               
               <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                 <select
                   value={filterStatus}
                   onChange={(e) => setFilterStatus(e.target.value)}
                   className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                 >
                   <option value="all">All Statuses</option>
                   <option value="active">Active Only</option>
                   <option value="inactive">Inactive Only</option>
                 </select>
                 
                 <select
                   value={filterCampaign}
                   onChange={(e) => setFilterCampaign(e.target.value)}
                   className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block p-2"
                 >
                   <option value="all">All Campaigns</option>
                   <option value="unlinked">Unlinked Nodes</option>
                   {campaigns?.map(c => (
                     <option key={c.id} value={c.id}>{c.name}</option>
                   ))}
                 </select>
               </div>
            </div>
            
            <QRList qrs={paginatedQRs} campaigns={campaigns} updateQR={updateQR} deleteQR={deleteQR} />
            
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-2 border-t border-gray-100 pt-6">
                 <button 
                   disabled={currentPage === 1}
                   onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                   className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
                 >
                   Previous
                 </button>
                 <span className="text-gray-500 text-sm font-medium px-4">
                   Page {currentPage} of {totalPages}
                 </span>
                 <button 
                   disabled={currentPage === totalPages}
                   onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                   className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg disabled:opacity-50 hover:bg-gray-50 transition"
                 >
                   Next
                 </button>
              </div>
            )}
            
          </div>
        )}
      </main>
    </div>
  );
}
