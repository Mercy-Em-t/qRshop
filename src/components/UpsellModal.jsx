export default function UpsellModal({ upsellItems, onAccept, onDecline }) {
  if (!upsellItems || upsellItems.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl animate-in">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Would you also like?
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Customers who ordered this also enjoyed:
        </p>
        <div className="flex flex-col gap-2 mb-4">
          {upsellItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onAccept(item)}
              className="flex items-center justify-between border border-gray-200 rounded-lg p-3 hover:bg-green-50 transition-colors cursor-pointer"
            >
              <span className="font-medium text-gray-800">{item.name}</span>
              <span className="text-green-700 font-semibold">
                KSh {item.price}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={onDecline}
          className="w-full py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors cursor-pointer"
        >
          No thanks
        </button>
      </div>
    </div>
  );
}
