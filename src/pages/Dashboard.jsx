import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getOrdersPerDay, getPopularItems, getUpsellStats } from "../services/analytics-service";
import { getSubscription } from "../services/subscription-service";
import AnalyticsChart from "../components/AnalyticsChart";
import SubscriptionStatus from "../components/SubscriptionStatus";

export default function Dashboard() {
  const [ordersPerDay, setOrdersPerDay] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [upsellStats, setUpsellStats] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  // TODO: Get shopId from auth context after login
  const shopId = null;

  useEffect(() => {
    async function fetchAnalytics() {
      if (!shopId) {
        setLoading(false);
        return;
      }

      try {
        const [orders, popular, upsells, sub] = await Promise.all([
          getOrdersPerDay(shopId),
          getPopularItems(shopId),
          getUpsellStats(shopId),
          getSubscription(shopId),
        ]);
        setOrdersPerDay(orders);
        setPopularItems(popular);
        setUpsellStats(upsells);
        setSubscription(sub);
      } catch {
        // Analytics loading failed silently
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [shopId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Shop Dashboard</h1>
          <Link
            to="/login"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Logout
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Subscription Status */}
        <div className="mb-6">
          <SubscriptionStatus subscription={subscription} />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/dashboard/orders"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-transparent hover:border-green-100 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-green-500 w-16 h-16 rounded-bl-full opacity-10"></div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              🛎 Live Orders
            </h2>
            <p className="text-gray-500 text-sm">
              Manage incoming customer orders and trigger STK Pushes.
            </p>
          </Link>

          <Link
            to="/menu-manager"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              📋 Menu Manager
            </h2>
            <p className="text-gray-500 text-sm">
              Add, edit, and remove menu items and categories.
            </p>
          </Link>

          <Link
            to="/dashboard/qrs"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-transparent hover:border-blue-100 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-blue-500 w-16 h-16 rounded-bl-full opacity-10"></div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              📱 QR Manager
            </h2>
            <p className="text-gray-500 text-sm">
              Deploy, track, and edit your fleet of smart QR table nodes.
            </p>
          </Link>

          <Link
            to="/plans"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              💳 Subscription
            </h2>
            <p className="text-gray-500 text-sm">
              Manage your plan and unlock premium features.
            </p>
          </Link>
        </div>

        {/* Analytics Section */}
        <h2 className="text-lg font-bold text-gray-800 mb-4">📊 Analytics</h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
            <p className="text-gray-500 text-sm">Loading analytics...</p>
          </div>
        ) : !shopId ? (
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <p className="text-gray-500">
              Analytics will be available after logging in with Supabase authentication.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnalyticsChart
              title="Orders Per Day"
              data={ordersPerDay}
              labelKey="date"
              valueKey="count"
              unit="orders"
            />

            <AnalyticsChart
              title="Popular Items"
              data={popularItems}
              labelKey="name"
              valueKey="count"
              unit="sold"
            />

            {upsellStats && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Upsell Conversion
                </h3>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{upsellStats.rate}%</p>
                    <p className="text-sm text-gray-500">Conversion Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-gray-700">{upsellStats.accepted}</p>
                    <p className="text-sm text-gray-500">Accepted</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-gray-700">{upsellStats.total}</p>
                    <p className="text-sm text-gray-500">Total Shown</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Revenue Per Day
              </h3>
              {ordersPerDay.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {ordersPerDay.map((day, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-gray-600">{day.date}</span>
                      <span className="font-medium text-gray-800">KSh {day.revenue}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No revenue data yet.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
