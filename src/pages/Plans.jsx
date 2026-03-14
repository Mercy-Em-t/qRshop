import { Link } from "react-router-dom";

export default function Plans() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            to="/dashboard"
            className="text-green-600 font-medium hover:text-green-700 transition-colors"
          >
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Subscription Plans</h1>
          <div className="w-24"></div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Free Plan</h2>
            <p className="text-3xl font-bold text-gray-800 mb-4">
              KSh 0<span className="text-sm font-normal text-gray-500">/month</span>
            </p>
            <ul className="flex flex-col gap-2 mb-6 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> QR-based ordering
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> WhatsApp checkout
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Onsite orders only
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-300">✗</span> Online ordering
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-300">✗</span> Analytics dashboard
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-300">✗</span> Priority support
              </li>
            </ul>
            <button
              disabled
              className="w-full py-2 border border-gray-300 text-gray-500 rounded-lg font-medium cursor-not-allowed"
            >
              Current Plan
            </button>
          </div>

          {/* Paid Plan */}
          <div className="bg-white rounded-xl shadow-sm p-6 border-2 border-green-500 relative">
            <span className="absolute -top-3 left-4 bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium">
              Recommended
            </span>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Paid Plan</h2>
            <p className="text-3xl font-bold text-gray-800 mb-4">
              KSh 2,500<span className="text-sm font-normal text-gray-500">/month</span>
            </p>
            <ul className="flex flex-col gap-2 mb-6 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> QR-based ordering
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> WhatsApp checkout
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Online ordering
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Analytics dashboard
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Payment integration
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Priority support
              </li>
            </ul>
            <button className="w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors cursor-pointer">
              Upgrade Now
            </button>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-xl shadow-sm p-6 text-center">
          <p className="text-gray-500 text-sm">
            Payment processing will be available after M-Pesa/Stripe integration is configured.
          </p>
        </div>
      </main>
    </div>
  );
}
