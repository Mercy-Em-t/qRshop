import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../services/auth-service";
import { supabase } from "../services/supabase-client";
import { getOrdersPerDay, getPopularItems, getUpsellStats } from "../services/analytics-service";
import { getSubscription } from "../services/subscription-service";
import AnalyticsChart from "../components/AnalyticsChart";
import SubscriptionStatus from "../components/SubscriptionStatus";

export default function Dashboard() {
  const [ordersPerDay, setOrdersPerDay] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [upsellStats, setUpsellStats] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const user = getCurrentUser();
  const shopId = user?.shop_id;

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
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

  // Dedicated poll for Actionable Orders
  useEffect(() => {
    if (!shopId) return;

    const fetchPendingCount = async () => {
      const { count } = await supabase
        .from("orders")
        .select('*', { count: 'exact', head: true })
        .eq("shop_id", shopId)
        .in("status", ["pending_payment", "pending", "stk_pushed"]);
      
      setPendingOrdersCount(count || 0);
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 10000); // 10s poll
    return () => clearInterval(interval);
  }, [shopId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Shop Dashboard</h1>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Subscription Status */}
        <div className="mb-6">
          <SubscriptionStatus subscription={subscription} />
        </div>

        {/* Action Alert Banner */}
        {pendingOrdersCount > 0 && (
          <div className="mb-8 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-sm flex items-center justify-between animate-pulse">
            <div>
              <h3 className="text-red-800 font-bold text-lg flex items-center gap-2">
                <span className="text-2xl">🔔</span> Action Required
              </h3>
              <p className="text-red-700 text-sm mt-1">
                You have {pendingOrdersCount} {pendingOrdersCount === 1 ? 'order' : 'orders'} waiting for your approval!
              </p>
            </div>
            <Link 
              to="/dashboard/orders"
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-red-700 transition"
            >
              View Orders
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/dashboard/orders"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-transparent hover:border-green-100 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-green-500 w-16 h-16 rounded-bl-full opacity-10"></div>
            {pendingOrdersCount > 0 && (
               <div className="absolute top-4 right-4 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md">
                 {pendingOrdersCount}
               </div>
            )}
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
            to="/dashboard/marketing"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-transparent hover:border-indigo-100 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-indigo-500 w-16 h-16 rounded-bl-full opacity-10"></div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              🎨 Ad Generator
            </h2>
            <p className="text-gray-500 text-sm">
              Create and download high-converting WhatsApp & Instagram Stories targeting your QR nodes.
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
