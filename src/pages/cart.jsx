import { Link } from 'react-router-dom'

export default function CartPage() {
  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-6 text-2xl font-bold">Cart</h1>
      <p className="text-gray-500">Review your order before checkout.</p>
      <Link
        to="/order"
        className="mt-6 inline-block rounded-md bg-green-600 px-6 py-3 text-white font-medium hover:bg-green-700"
      >
        Confirm Order
      </Link>
    </div>
  )
}
