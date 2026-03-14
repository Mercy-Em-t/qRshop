export default function Cart({ items, total, onUpdateQuantity, onRemoveItem }) {
  if (items.length === 0) {
    return <p className="py-4 text-center text-gray-500">Your cart is empty.</p>
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between rounded-md border border-gray-200 p-3"
        >
          <div>
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-gray-500">KSh {item.price} each</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
              className="rounded bg-gray-200 px-2 py-1 text-sm hover:bg-gray-300"
            >
              −
            </button>
            <span className="w-6 text-center">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="rounded bg-gray-200 px-2 py-1 text-sm hover:bg-gray-300"
            >
              +
            </button>
            <button
              onClick={() => onRemoveItem(item.id)}
              className="ml-2 text-sm text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <div className="border-t pt-3 text-right text-lg font-bold">
        Total: KSh {total}
      </div>
    </div>
  )
}
