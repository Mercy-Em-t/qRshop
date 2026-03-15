import { useState } from 'react';
import { useQRs } from '../../hooks/useQRs';
import QRList from '../../components/QRList';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function DashboardIndex() {
  // Hardcoded for V3 MVP. Auth wrapper handles this in prod.
  const shopId = 'test-shop-id-1234-5678-9abcdef01234'; 
  const { qrs, loading } = useQRs(shopId);

  // We could mount the QrGenerator directly in here as a modal later, 
  // but for now, we leave the action pointing to the current factory page.
  // We'll just manage the node display and routing.

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
           {/* Pointing this to our existing QrGenerator to keep flow simple for now */}
           <a 
             href="/qr-generator"
             className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-medium shadow-sm transition-all hover:shadow"
           >
             + Deploy New Node
           </a>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
        <div className="mb-6 flex justify-between items-center">
           <h2 className="text-xl font-semibold text-gray-800">Deployed Sensors</h2>
           <span className="bg-gray-200 text-gray-700 py-1 px-3 rounded-full text-sm font-medium">
             {qrs?.length || 0} Nodes
           </span>
        </div>
        <QRList qrs={qrs} />
      </div>
    </div>
  );
}
