export default function Cart({ items, onAdd, onRemove, total }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">Your cart is empty</p>
        <p className="text-sm mt-1">Add items from the menu to get started</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between border border-gray-200 rounded-lg p-3 bg-white"
        >
          <div>
            <h4 className="font-medium text-gray-800">{item.name}</h4>
            <p className="text-sm text-gray-500">KSh {item.price} each</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onRemove(item.id)}
              className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center hover:bg-gray-300 transition-colors cursor-pointer"
            >
              −
            </button>
            <span className="font-semibold text-gray-800 w-6 text-center">
              {item.quantity}
            </span>
            <button
              onClick={() => onAdd(item)}
              className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition-colors cursor-pointer"
            >
              +
            </button>
          </div>
        </div>
      ))}

      <div className="border-t border-gray-300 pt-3 mt-2 flex justify-between items-center">
        <span className="text-lg font-semibold text-gray-800">Total</span>
        <span className="text-xl font-bold text-green-700">KSh {total}</span>
      </div>
    </div>
  );
}
