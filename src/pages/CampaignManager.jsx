import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser } from "../services/auth-service";
import { useCampaigns } from "../hooks/useCampaigns";
import { getCampaignMetrics } from "../services/campaign-service";
import LoadingSpinner from "../components/LoadingSpinner";

export default function CampaignManager() {
  const user = getCurrentUser();
  const shopId = user?.shop_id;
  const navigate = useNavigate();
  const { campaigns, loading, addCampaign, updateCampaign, deleteCampaign } = useCampaigns(shopId);

  const [metrics, setMetrics] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    reward_type: "discount",
    reward_value_number: 20
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    async function fetchAllMetrics() {
      const metricMap = {};
      for (const camp of campaigns) {
        metricMap[camp.id] = await getCampaignMetrics(camp.id);
      }
      setMetrics(metricMap);
    }
    if (campaigns.length > 0) {
      fetchAllMetrics();
    }
  }, [campaigns]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: newCampaign.name,
      reward_type: newCampaign.reward_type,
      reward_value: { percentage: newCampaign.reward_value_number },
      is_active: true
    };
    await addCampaign(payload);
    setShowCreateModal(false);
    setNewCampaign({ name: "", reward_type: "discount", reward_value_number: 20 });
  };

  const handleToggleActive = async (camp) => {
    await updateCampaign(camp.id, { is_active: !camp.is_active });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="text-purple-600 font-medium hover:text-purple-700 transition-colors"
          >
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Campaigns</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            + New Campaign
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
        {loading ? (
          <LoadingSpinner message="Loading Campaigns..." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.length === 0 ? (
              <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-gray-200 shadow-sm">
                <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                  🎯
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No Campaigns Yet</h3>
                <p className="text-gray-500 mb-6">Create your first campaign to incentivize scans and grow your business.</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-purple-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-purple-700 transition-colors"
                >
                  Create Campaign
                </button>
              </div>
            ) : (
              campaigns.map(camp => (
                <div key={camp.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                  <div className={`h-2 ${camp.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <h2 className="text-xl font-bold text-gray-800">{camp.name}</h2>
                      <button
                        onClick={() => handleToggleActive(camp)}
                        className={`px-3 py-1 rounded-full text-xs font-bold leading-none ${
                          camp.is_active 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {camp.is_active ? 'Active' : 'Paused'}
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-6">
                      <span className="bg-purple-50 text-purple-700 text-sm font-medium px-2.5 py-1 rounded-lg border border-purple-100">
                        {camp.reward_value?.percentage || 0}% {camp.reward_type}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-auto pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Total Claims</p>
                        <p className="text-2xl font-bold text-gray-800">{metrics[camp.id]?.totalScans || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Conv. Rate</p>
                        <p className="text-2xl font-bold text-purple-600">{metrics[camp.id]?.conversionRate || 0}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative z-10 animate-fade-in-up">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">New Campaign</h2>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                  <input
                    type="text"
                    required
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                    placeholder="e.g., Summer Special"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reward Type</label>
                  <select
                    value={newCampaign.reward_type}
                    onChange={(e) => setNewCampaign({...newCampaign, reward_type: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="discount">Discount Percentage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reward Value (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={newCampaign.reward_value_number}
                    onChange={(e) => setNewCampaign({...newCampaign, reward_value_number: Number(e.target.value)})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white bg-purple-600 hover:bg-purple-700 rounded-xl font-bold shadow-md transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
