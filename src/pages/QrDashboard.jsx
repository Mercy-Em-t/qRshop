import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getShopQrs } from "../services/qr-node-service";
import { supabase } from "../services/supabase-client";
import LoadingSpinner from "../components/LoadingSpinner";

export default function QrDashboard() {
  const [qrs, setQrs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Inline Edit State
  const [editingId, setEditingId] = useState(null);
  const [editLocation, setEditLocation] = useState("");
  const [editAction, setEditAction] = useState("");

  // In a real app we'd get this from auth
  const shopId = "11111111-1111-1111-1111-111111111111";

  const loadQrs = async () => {
    try {
      const data = await getShopQrs(shopId);
      setQrs(data || []);
    } catch (err) {
      console.error("Failed to load QRs", err);
    } finally {
      if (loading) setLoading(false);
    }
  };

  useEffect(() => {
    loadQrs();
  }, [shopId]);

  const toggleStatus = async (qr) => {
    const newStatus = qr.status === 'active' ? 'disabled' : 'active';
    // Optimistic UI update
    setQrs(current => current.map(q => q.id === qr.id ? { ...q, status: newStatus } : q));
    const { error } = await supabase.from('qrs').update({ status: newStatus }).eq('id', qr.id);
    if (error) loadQrs(); // Revert on failure
  };

  const deleteNode = async (id) => {
    if (!window.confirm(`Are you sure you want to completely destroy QR Node ${id}? This cannot be undone.`)) return;
    setQrs(current => current.filter(q => q.id !== id));
    await supabase.from('qrs').delete().eq('id', id);
  };

  const startEdit = (qr) => {
    setEditingId(qr.id);
    setEditLocation(qr.location);
    setEditAction(qr.action);
  };

  const saveEdit = async (id) => {
    setQrs(current => current.map(q => q.id === id ? { ...q, location: editLocation, action: editAction } : q));
    setEditingId(null);
    await supabase.from('qrs').update({ location: editLocation, action: editAction }).eq('id', id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
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
               + New QR
             </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <LoadingSpinner message="Loading QR nodes..." />
        ) : qrs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <h2 className="text-xl font-semibold mb-2">No QR Nodes Found</h2>
            <p className="text-gray-500 mb-6">Create your first smart QR node to track customer telemetry.</p>
             <Link
              to="/qr-generator"
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors inline-block"
             >
               Create First Node
             </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 font-semibold text-gray-600 text-sm">Node ID</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Location</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Action</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Metrics</th>
                </tr>
              </thead>
              <tbody>
                {qrs.map((qr) => (
                  <tr key={qr.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-mono text-sm text-gray-800 font-semibold">{qr.id}</td>
                    
                    <td className="p-4">
                      {editingId === qr.id ? (
                        <input 
                          type="text" 
                          value={editLocation} 
                          onChange={(e) => setEditLocation(e.target.value)}
                          className="w-full border border-gray-300 rounded px-2 py-1 text-sm outline-none focus:border-green-500"
                        />
                      ) : (
                        <span className="text-gray-800">{qr.location}</span>
                      )}
                    </td>

                    <td className="p-4">
                      {editingId === qr.id ? (
                        <select 
                          value={editAction} 
                          onChange={(e) => setEditAction(e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-sm bg-white outline-none focus:border-green-500"
                        >
                          <option value="open_menu">open_menu</option>
                          <option value="call_waiter">call_waiter</option>
                          <option value="pay_bill">pay_bill</option>
                        </select>
                      ) : (
                        <span className="bg-blue-50 border border-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-medium tracking-wide">
                          {qr.action}
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      <button 
                        onClick={() => toggleStatus(qr)}
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase cursor-pointer hover:opacity-80 transition-opacity ${
                           qr.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {qr.status}
                      </button>
                    </td>

                    <td className="p-4">
                      <Link to={`/dashboard/qrs/${qr.id}`} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                        Stats →
                      </Link>
                    </td>

                    <td className="p-4 flex justify-end gap-2">
                      {editingId === qr.id ? (
                        <button onClick={() => saveEdit(qr.id)} className="text-green-600 hover:bg-green-50 p-1.5 rounded-md transition-colors text-sm font-medium">
                          Save
                        </button>
                      ) : (
                        <button onClick={() => startEdit(qr)} className="text-gray-500 hover:text-gray-800 hover:bg-gray-100 p-1.5 rounded-md transition-colors text-sm font-medium">
                          Edit
                        </button>
                      )}
                      
                      <button onClick={() => deleteNode(qr.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-md transition-colors text-sm font-medium">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
