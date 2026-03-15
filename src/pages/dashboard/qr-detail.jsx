import { useParams, Link } from 'react-router-dom';
import { useEvents } from '../../hooks/useEvents';
import { QRCodeSVG } from 'qrcode.react';

export default function QRAnalytics() {
  const { qrId } = useParams();
  const { events, loading, conversionRate } = useEvents(qrId);

  if (loading) {
    return (
       <div className="min-h-[50vh] flex items-center justify-center">
         <div className="text-gray-500 animate-pulse font-medium">Loading telemetry blocks...</div>
       </div>
    );
  }

  const scans = events.filter(e => e.event_type === 'qr_scanned').length;
  const menuViews = events.filter(e => e.event_type === 'menu_opened').length;
  const ordersStarting = events.filter(e => e.event_type === 'order_started').length;
  const url = `${window.location.origin}/q/${qrId}`;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
         <Link to="/dashboard/qrs" className="text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-2">
            ← Back to Fleet
         </Link>
         <h1 className="text-2xl font-bold tracking-tight">Node <span className="font-mono text-blue-600 bg-blue-50 px-2 rounded-md">{qrId}</span></h1>
      </div>

      {/* Overview Top */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         
         <div className="md:col-span-2 grid grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
               <h3 className="text-gray-500 font-medium mb-1">Total Gateway Scans</h3>
               <p className="text-4xl font-bold text-gray-800">{scans}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
               <h3 className="text-gray-500 font-medium mb-1">Conversion to Order</h3>
               <p className="text-4xl font-bold text-green-600">{(conversionRate * 100).toFixed(1)}%</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
               <h3 className="text-gray-500 font-medium mb-1">Menu Exits</h3>
               <p className="text-4xl font-bold text-orange-500">{scans - menuViews}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
               <h3 className="text-gray-500 font-medium mb-1">Carts Initialized</h3>
               <p className="text-4xl font-bold text-blue-600">{ordersStarting}</p>
            </div>
         </div>

         {/* Visual Graphic Download */}
         <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center justify-center">
            <h3 className="font-semibold text-gray-800 mb-4">Node Graphic</h3>
            <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm mb-4">
               <QRCodeSVG value={url} size={150} level="H" includeMargin={false} />
            </div>
            <a 
              href={url} 
              target="_blank" 
              rel="noreferrer"
              className="text-xs bg-gray-50 font-mono text-gray-500 p-2 rounded w-full break-all border border-gray-200"
            >
               {url}
            </a>
         </div>
      </div>
      
      {/* Event Stream Log */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
         <h3 className="font-bold text-lg mb-6 border-b border-gray-100 pb-4">Raw Telemetry Stream</h3>
         {events.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Awaiting first physical interaction...</p>
         ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
               {events.map((e) => (
                  <div key={e.id} className="flex flex-col sm:flex-row justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors border border-gray-100/50">
                    <div className="flex items-center gap-4">
                       <span className={`w-2.5 h-2.5 rounded-full ${
                          e.event_type === 'qr_scanned' ? 'bg-blue-400' :
                          e.event_type.includes('order') ? 'bg-green-400' : 'bg-gray-400'
                       }`}></span>
                       <div>
                          <p className="font-semibold text-gray-800">{e.event_type}</p>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">Session: {e.session_id?.split('-')[0] || 'legacy'} | Device: {e.device_id?.split('-')[0] || 'anon'}</p>
                       </div>
                    </div>
                    <div className="text-sm text-gray-500 sm:text-right mt-2 sm:mt-0 font-medium">
                       {new Date(e.timestamp).toLocaleString(undefined, { 
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                       })}
                    </div>
                  </div>
               ))}
            </div>
         )}
      </div>
    </div>
  );
}
