import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">qRshop</h1>
        <p className="text-gray-500 mb-8">
          QR-based ordering for restaurants, cafés, and kiosks.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            to="/login"
            className="bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Shop Owner Login
          </Link>
          <Link
            to="/admin"
            className="bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition-colors"
          >
            Admin Panel
          </Link>
        </div>

        <p className="text-sm text-gray-400 mt-8">
          Customers: scan the QR code at your table to order.
        </p>
      </div>
    </div>
  );
}
