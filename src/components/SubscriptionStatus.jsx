/**
 * Displays the current subscription plan status for a shop.
 */
export default function SubscriptionStatus({ subscription }) {
  if (!subscription) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-gray-300">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Free Plan</h3>
            <p className="text-sm text-gray-500 mt-1">
              QR ordering with WhatsApp checkout. Upgrade for analytics, online ordering, and more.
            </p>
          </div>
          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full">
            Free
          </span>
        </div>
      </div>
    );
  }

  const isActive = subscription.status === "active" && new Date(subscription.end_date) > new Date();
  const daysRemaining = Math.max(
    0,
    Math.ceil((new Date(subscription.end_date) - new Date()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 border-l-4 ${isActive ? "border-green-500" : "border-red-400"}`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {subscription.plan_type === "paid" ? "Paid Plan" : "Free Plan"}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {isActive
              ? `${daysRemaining} days remaining`
              : "Plan expired. Renew to restore premium features."}
          </p>
        </div>
        <span
          className={`px-3 py-1 text-sm font-medium rounded-full ${
            isActive
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {isActive ? "Active" : "Expired"}
        </span>
      </div>
    </div>
  );
}
