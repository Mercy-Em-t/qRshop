import { useNavigate } from 'react-router-dom';

export default function QRCard({ qr }) {
  const navigate = useNavigate();

  return (
    <div className="border border-gray-200 p-5 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-4">
          <h2 className="font-bold text-lg text-gray-800 line-clamp-1">{qr.location}</h2>
          <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${qr.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {qr.status}
          </span>
        </div>
        <div className="text-sm text-gray-600 mb-6 space-y-1">
          <p className="flex justify-between">
            <span className="text-gray-400">Node ID:</span> 
            <span className="font-mono bg-gray-50 px-1 rounded">{qr.id}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-gray-400">Action:</span> 
            <span className="font-medium text-blue-600">{qr.action}</span>
          </p>
        </div>
      </div>
      <button
        onClick={() => navigate(`/dashboard/qrs/${qr.id}`)}
        className="w-full mt-auto px-4 py-2.5 bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-200 hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-colors"
      >
        View Analytics
      </button>
    </div>
  );
}
