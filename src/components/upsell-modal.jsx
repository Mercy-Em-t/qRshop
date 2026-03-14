export default function UpsellModal({ upsellItems, onAccept, onDecline }) {
  if (!upsellItems || upsellItems.length === 0) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <h3 className="mb-3 text-lg font-semibold">You might also like</h3>
        <ul className="mb-4 space-y-2">
          {upsellItems.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between rounded border p-2"
            >
              <span>{item.name}</span>
              <span className="text-sm font-medium">KSh {item.price}</span>
            </li>
          ))}
        </ul>
        <div className="flex gap-3">
          <button
            onClick={onAccept}
            className="flex-1 rounded-md bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Add Items
          </button>
          <button
            onClick={onDecline}
            className="flex-1 rounded-md border border-gray-300 py-2 text-sm font-medium hover:bg-gray-50"
          >
            No Thanks
          </button>
        </div>
      </div>
    </div>
  )
}
