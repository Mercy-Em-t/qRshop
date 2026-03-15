import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function QRCard({ qr, updateQR, deleteQR }) {
  const navigate = useNavigate();
  const [isPending, setIsPending] = useState(false);

  const handleToggleStatus = async (e) => {
    e.stopPropagation();
    setIsPending(true);
    const newStatus = qr.status === 'active' ? 'inactive' : 'active';
    await updateQR(qr.id, { status: newStatus });
    setIsPending(false);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete node ${qr.id}? All associated historical telemetry will remain anonymous via Gateway.`)) {
      setIsPending(true);
      await deleteQR(qr.id);
    }
  };

  return (
    <div className={`border border-gray-200 p-5 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
      <div>
        <div className="flex justify-between items-start mb-4">
          <h2 className="font-bold text-lg text-gray-800 line-clamp-1">{qr.location}</h2>
          <button 
            onClick={handleToggleStatus}
            title="Click to toggle status"
            className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap cursor-pointer hover:ring-2 hover:ring-offset-1 transition-all ${qr.status === 'active' ? 'bg-green-100 text-green-800 ring-green-400' : 'bg-red-100 text-red-800 ring-red-400'}`}
          >
            {qr.status}
          </button>
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
      <div className="flex gap-2 mt-auto">
         <button
           onClick={() => navigate(`/dashboard/qrs/${qr.id}`)}
           className="flex-1 px-4 py-2 bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-200 hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-colors"
         >
           View Output
         </button>
         <button
           onClick={handleDelete}
           className="px-3 py-2 bg-red-50 text-red-600 font-medium rounded-lg border border-red-100 hover:bg-red-100 transition-colors"
         >
           Delete
         </button>
      </div>
    </div>
  );
}
