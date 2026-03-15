import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getShopQrs } from "../services/qr-node-service";
import LoadingSpinner from "../components/LoadingSpinner";

export default function QrDashboard() {
  const [qrs, setQrs] = useState([]);
  const [loading, setLoading] = useState(true);

  // In a real app we'd get this from auth
  const shopId = "test-shop-id-123";

  useEffect(() => {
    async function loadQrs() {
      try {
        const data = await getShopQrs(shopId);
        setQrs(data || []);
      } catch (err) {
        console.error("Failed to load QRs", err);
      } finally {
        setLoading(false);
      }
    }
    loadQrs();
  }, [shopId]);

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
                  <tr key={qr.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="p-4 font-mono text-sm text-gray-800">{qr.id}</td>
                    <td className="p-4 text-gray-800">{qr.location}</td>
                    <td className="p-4 text-gray-600 text-sm">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">{qr.action}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-sm ${qr.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {qr.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <Link to={`/dashboard/qrs/${qr.id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        View Stats →
                      </Link>
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
