import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getQrMetrics } from '../services/telemetry-service';

export default function QRCard({ qr, updateQR, deleteQR }) {
  const navigate = useNavigate();
  const [isPending, setIsPending] = useState(false);
  const [editingLoc, setEditingLoc] = useState(false);
  const [editLocation, setEditLocation] = useState(qr.location);
  const [metrics, setMetrics] = useState({ totalScans: 0 });

  useEffect(() => {
    async function loadMetrics() {
      const data = await getQrMetrics(qr.id);
      setMetrics(data);
    }
    loadMetrics();
  }, [qr.id]);

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
          {editingLoc ? (
             <input 
                 value={editLocation} 
                 onChange={e => setEditLocation(e.target.value)} 
                 onBlur={async () => {
                     setEditingLoc(false);
                     if (editLocation.trim() !== qr.location) {
                         setIsPending(true);
                         await updateQR(qr.id, { location: editLocation });
                         setIsPending(false);
                     }
                 }}
                 autoFocus
                 className="w-full border-b-2 border-blue-400 font-bold text-lg text-gray-800 outline-none bg-blue-50 px-1"
             />
          ) : (
             <h2 
                 onClick={(e) => { e.stopPropagation(); setEditingLoc(true); }}
                 title="Click to rename location"
                 className="font-bold text-lg text-gray-800 line-clamp-1 cursor-pointer hover:text-blue-600 border-b border-transparent hover:border-blue-200 transition-colors"
             >
                 {qr.location}
             </h2>
          )}
          <button 
            onClick={handleToggleStatus}
            title="Click to toggle status"
            className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap cursor-pointer hover:ring-2 hover:ring-offset-1 transition-all ${qr.status === 'active' ? 'bg-green-100 text-green-800 ring-green-400' : 'bg-red-100 text-red-800 ring-red-400'}`}
          >
            {qr.status}
          </button>
        </div>
        <div className="text-sm text-gray-600 mb-6 space-y-3">
          <div className="flex justify-between items-center bg-gray-50 border border-gray-100 px-3 py-2 rounded-lg">
            <span className="text-gray-500 font-medium">Node ID</span> 
            <span className="font-mono font-bold text-gray-700">{qr.id}</span>
          </div>
          <div className="flex justify-between items-center bg-gray-50 border border-gray-100 px-3 py-2 rounded-lg">
            <span className="text-gray-500 font-medium">Total Scans</span> 
            <span className="font-bold text-gray-700">{metrics.totalScans} hits</span>
          </div>
          <div className="flex justify-between items-center bg-blue-50/50 border border-blue-100 px-3 py-2 rounded-lg">
            <span className="text-blue-800 font-medium">Instruction</span> 
            <div className="relative">
               <select 
                 value={qr.action}
                 onChange={async (e) => {
                    setIsPending(true);
                    await updateQR(qr.id, { action: e.target.value });
                    setIsPending(false);
                 }}
                 disabled={isPending}
                 className="appearance-none bg-white border border-blue-200 text-blue-700 font-bold py-1 pl-3 pr-8 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm cursor-pointer disabled:opacity-50 transition-all hover:bg-blue-50"
               >
                 <option value="open_menu">Open Menu</option>
                 <option value="open_order">Fast Order Mode</option>
                 <option value="open_campaign">Marketing Campaign</option>
               </select>
               <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-blue-500">
                 <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
               </div>
            </div>
          </div>
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
