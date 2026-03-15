import QRCard from './QRCard'

export default function QRList({ qrs }) {
  if (!qrs || !qrs.length) {
    return (
      <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 text-gray-500">
        <p className="mb-2">No QR nodes deployed yet.</p>
        <p className="text-sm text-gray-400">Create a node above to start tracking physical interactions.</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {qrs.map(qr => (
        <QRCard key={qr.id} qr={qr} />
      ))}
    </div>
  )
}
