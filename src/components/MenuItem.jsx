export default function MenuItem({ item, onAdd }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2 bg-white shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800">{item.name}</h3>
      {item.description && (
        <p className="text-sm text-gray-500">{item.description}</p>
      )}
      <div className="flex items-center justify-between mt-auto">
        <span className="text-lg font-bold text-green-700">
          KSh {item.price}
        </span>
        <button
          onClick={() => onAdd(item)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors cursor-pointer"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
