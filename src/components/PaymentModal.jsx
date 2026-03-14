import { useState } from "react";

/**
 * Modal for handling online payment (M-Pesa / Stripe).
 * This is the UI shell; actual payment processing is handled by services.
 */
export default function PaymentModal({ amount, onComplete, onCancel }) {
  const [method, setMethod] = useState("mpesa");
  const [processing, setProcessing] = useState(false);
  const [phone, setPhone] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    // Simulate payment processing delay
    // In production, this would call the payment service
    try {
      await onComplete({ method, phone, amount });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl animate-in">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Pay KSh {amount}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Choose your payment method:
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMethod("mpesa")}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                method === "mpesa"
                  ? "border-green-600 bg-green-50 text-green-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              M-Pesa
            </button>
            <button
              type="button"
              onClick={() => setMethod("card")}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                method === "card"
                  ? "border-green-600 bg-green-50 text-green-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              Card
            </button>
          </div>

          {method === "mpesa" && (
            <div>
              <label
                htmlFor="pay-phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                M-Pesa Phone Number
              </label>
              <input
                id="pay-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 0712345678"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}

          {method === "card" && (
            <p className="text-sm text-gray-400 text-center py-2">
              Card payment integration coming soon.
            </p>
          )}

          <button
            type="submit"
            disabled={processing || (method === "mpesa" && !phone)}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {processing ? "Processing..." : `Pay KSh ${amount}`}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="w-full py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
