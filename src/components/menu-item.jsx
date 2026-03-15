export default function MenuItem({ item, onAddToCart }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 shadow-sm">
      <h3 className="text-lg font-semibold">{item.name}</h3>
      {item.description && (
        <p className="mt-1 text-sm text-gray-500">{item.description}</p>
      )}
      <p className="mt-2 font-medium">KSh {item.price}</p>
      <button
        onClick={() => onAddToCart(item)}
        className="mt-3 w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
      >
        Add to Cart
      </button>
    </div>
  )
}
