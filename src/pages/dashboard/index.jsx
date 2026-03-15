import { useState } from 'react';
import { useQRs } from '../../hooks/useQRs';
import QRList from '../../components/QRList';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function DashboardIndex() {
  // Hardcoded for V3 MVP. Auth wrapper handles this in prod.
  const shopId = 'test-shop-id-1234-5678-9abcdef01234'; 
  const { qrs, loading, addQR, updateQR, deleteQR } = useQRs(shopId);

  const [showModal, setShowModal] = useState(false);
  const [newLocation, setNewLocation] = useState("");
  const [newAction, setNewAction] = useState("open_menu");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateNode = async (e) => {
    e.preventDefault();
    if (!newLocation) return;
    setIsCreating(true);
    
    // Generate a secure short ID for the gateway URL
    const shortId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    await addQR({
      id: shortId,
      shop_id: shopId,
      location: newLocation,
      action: newAction,
      status: 'active'
    });
    
    setIsCreating(false);
    setShowModal(false);
    setNewLocation("");
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center">
        <LoadingSpinner message="Syncing Nodes..." />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in fade-in">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
           <h1 className="text-3xl font-bold text-gray-800 mb-2 tracking-tight">QR Manager</h1>
           <p className="text-gray-500 text-lg">Manage your distributed physical nodes and behaviors.</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => setShowModal(true)}
             className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium shadow-sm transition-all hover:shadow"
           >
             + Deploy New Node
           </button>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
        <div className="mb-6 flex justify-between items-center">
           <h2 className="text-xl font-semibold text-gray-800">Deployed Sensors</h2>
           <span className="bg-gray-200 text-gray-700 py-1 px-3 rounded-full text-sm font-medium">
             {qrs?.length || 0} Nodes
           </span>
        </div>
        <QRList qrs={qrs} updateQR={updateQR} deleteQR={deleteQR} />
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full animate-fade-in">
            <h2 className="font-bold text-2xl text-gray-800 mb-6">Create Node</h2>
            <form onSubmit={handleCreateNode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Physical Location</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Table 12, Main Entrance"
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Standard Action</label>
                <select
                  value={newAction}
                  onChange={e => setNewAction(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="open_menu">Open Menu</option>
                  <option value="open_order">Fast Order Mode</option>
                  <option value="open_campaign">Marketing Campaign</option>
                </select>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 bg-blue-600 text-white font-medium py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isCreating ? "Spawning..." : "Save Node"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
