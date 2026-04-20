import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../services/auth-service";
import { supabase } from "../services/supabase-client";
import { getOrdersPerDay, getPopularItems, getUpsellStats } from "../services/analytics-service";
import { getSubscription } from "../services/subscription-service";
import AnalyticsChart from "../components/AnalyticsChart";
import SubscriptionStatus from "../components/SubscriptionStatus";
import OnboardingWizard from "../components/OnboardingWizard";
import UpgradeModal from "../components/UpgradeModal";
import MultiShopNoticeboard from "../components/MultiShopNoticeboard";
import AppLauncher from "../components/AppLauncher";
import ShareShopModal from "../components/ShareShopModal";
import usePlanAccess from "../hooks/usePlanAccess";

export default function Dashboard() {
  const [ordersPerDay, setOrdersPerDay] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [upsellStats, setUpsellStats] = useState(null);
  const [shop, setShop] = useState(null);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [lastCheckCount, setLastCheckCount] = useState(null);
  const [showNewOrderToast, setShowNewOrderToast] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [lockedFeatureFocus, setLockedFeatureFocus] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const planAccess = usePlanAccess();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

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
      if (!supabase) {
        setLoading(false);
        return;
      }

      // Check Onboarding Status
      try {
        const hasSeenOnboarding = localStorage.getItem(`onboarded_${shopId}`);
        if (!hasSeenOnboarding) {
          const { count: qrCount } = await supabase.from('qrs').select('*', { count: 'exact', head: true }).eq('shop_id', shopId);
          const { count: menuCount } = await supabase.from('menu_items').select('*', { count: 'exact', head: true }).eq('shop_id', shopId);
          
          if (qrCount === 0 && menuCount === 0) {
            setShowWizard(true);
          } else {
             // If they already have data but no flag, just safely mark it
             localStorage.setItem(`onboarded_${shopId}`, "true");
          }
        }
      } catch (e) {
         console.warn("Could not fetch onboarding stats", e);
      }

      try {
        const [orders, popular, upsells, shopRes] = await Promise.all([
          getOrdersPerDay(shopId),
          getPopularItems(shopId),
          getUpsellStats(shopId),
          supabase.from("shops").select("*, id:shop_id").eq("shop_id", shopId).single(),
        ]);
        setOrdersPerDay(orders);
        setPopularItems(popular);
        setUpsellStats(upsells);
        setShop(shopRes?.data || null);
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
      if (!supabase) return;
      const { count } = await supabase
        .from("orders")
        .select('*', { count: 'exact', head: true })
        .eq("shop_id", shopId)
        .in("status", ["pending_payment", "pending", "stk_pushed"]);
      
      const newCount = count || 0;
      
      // If count increased, show toast
      if (lastCheckCount !== null && newCount > lastCheckCount) {
         setShowNewOrderToast(true);
         // Play a subtle sound if possible, or just the toast
         try { new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play(); } catch(e) {}
         setTimeout(() => setShowNewOrderToast(false), 5000);
      }
      
      setPendingOrdersCount(newCount);
      setLastCheckCount(newCount);
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 10000); // 10s poll
    return () => clearInterval(interval);
  }, [shopId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800">Shop Dashboard</h1>
            {user?.role === 'system_admin' && (
              <span className="bg-slate-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest">Admin View</span>
            )}
          </div>
          {/* Desktop right-side */}
          <div className="hidden sm:flex items-center gap-4">
            <button 
              onClick={() => navigate("/shop-selection")}
              className="text-xs font-black bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition flex items-center gap-2 border border-white/10"
            >
              <span>🔄</span> Switch Shop
            </button>
            <button 
              onClick={() => setShowShareModal(true)}
              className="text-xs font-bold bg-theme-main text-white px-4 py-2 rounded-xl hover:bg-slate-900 transition flex items-center gap-2"
            >
              <span>🔗</span> Share Shop
            </button>
            {user?.role === 'system_admin' && <AppLauncher />}
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="text-sm font-bold text-red-500 hover:text-red-700 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            onClick={() => setMobileMenuOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>
        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-100 bg-white px-4 py-3 flex flex-col gap-3">
            <Link to="/dashboard/orders" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-700">🛎 Live Orders</Link>
            <Link to="/product-manager" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-700">📋 Product Manager</Link>
            <Link to="/dashboard/campaigns" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-700">🎁 Bundles</Link>
            <Link to="/dashboard/settings" onClick={() => setMobileMenuOpen(false)} className="text-sm font-bold text-slate-700">⚙️ Settings</Link>
            <button onClick={() => { logout(); navigate("/login"); }} className="text-sm font-bold text-red-500 text-left">Logout</button>
          </div>
        )}
      </header>

      <ShareShopModal 
        shop={shop} 
        isOpen={showShareModal} 
        onClose={() => setShowShareModal(false)} 
      />

      {/* New Order Toast */}
      {showNewOrderToast && (
        <div className="fixed top-20 right-4 z-[100] animate-bounce">
          <Link 
            to="/dashboard/orders"
            className="bg-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-green-400"
            onClick={() => setShowNewOrderToast(false)}
          >
            <span className="text-2xl">🔔</span>
            <div>
              <p className="font-bold text-sm">New Order Received!</p>
              <p className="text-[10px] opacity-90 uppercase font-black tracking-widest">Tap to process</p>
            </div>
          </Link>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {showWizard && (
          <OnboardingWizard 
            shopId={shopId} 
            onComplete={() => setShowWizard(false)} 
          />
        )}
        
        {lockedFeatureFocus && (
          <UpgradeModal 
             featureName={lockedFeatureFocus} 
             onClose={() => setLockedFeatureFocus(null)} 
          />
        )}
        
        {/* Subscription Status */}
        <div className="mb-6">
          <SubscriptionStatus shop={shop} />
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Master Account Global Noticeboard */}
          <MultiShopNoticeboard userId={user?.id} />

          {/* Quick Actions / Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
            to="/product-manager"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              📋 Product Manager
            </h2>
            <p className="text-gray-500 text-sm">
              Add, edit, and remove products, categories and search tags.
            </p>
          </Link>

          {planAccess.isPro ? (
             <a
               href="#analytics"
               className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-transparent hover:border-blue-100 relative overflow-hidden block cursor-pointer"
             >
               <div className="absolute top-0 right-0 bg-blue-500 w-16 h-16 rounded-bl-full opacity-10"></div>
               <h2 className="text-lg font-semibold text-gray-800 mb-2">
                 📈 Analytics
               </h2>
               <p className="text-gray-500 text-sm">
                 Historical data, popular items, and upsell tracking.
               </p>
             </a>
          ) : (
             <div 
               onClick={() => setLockedFeatureFocus("Advanced Analytics")}
               className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors relative"
             >
                <div className="absolute top-4 right-4 text-gray-400">🔒</div>
                <h2 className="text-lg font-semibold text-gray-500 mb-2">
                  📈 Analytics (Pro)
                </h2>
                <p className="text-gray-400 text-sm">
                  Upgrade to unlock historical data and upsell tracking.
                </p>
             </div>
          )}

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
            to="/dashboard/settings"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-transparent hover:border-gray-200 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-gray-500 w-16 h-16 rounded-bl-full opacity-10"></div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              ⚙️ Settings
            </h2>
            <p className="text-gray-500 text-sm">
              Update store info, logo, passwords, and manage plan.
            </p>
          </Link>
        
          {planAccess.isPro ? (
             <Link
               to="/dashboard/campaigns"
               className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-transparent hover:border-purple-100 relative overflow-hidden"
             >
               <div className="absolute top-0 right-0 bg-purple-500 w-16 h-16 rounded-bl-full opacity-10"></div>
               <h2 className="text-lg font-semibold text-gray-800 mb-2">
                 🎯 Campaigns
               </h2>
               <p className="text-gray-500 text-sm">
                 Manage promotional campaigns and targeted QR rewards.
               </p>
             </Link>
          ) : (
             <div
               onClick={() => setLockedFeatureFocus("Active Marketing Campaigns")}
               className="bg-gray-50 rounded-xl border border-gray-200 p-6 relative overflow-hidden cursor-pointer group"
             >
               <div className="absolute top-4 right-4 text-gray-400 group-hover:text-indigo-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
               </div>
               <h2 className="text-lg font-semibold text-gray-500 mb-2 transition-colors group-hover:text-gray-800">
                 🎯 Campaigns
               </h2>
               <p className="text-gray-400 text-sm">
                 Manage promotional campaigns and targeted QR rewards.
               </p>
             </div>
          )}

          {/* Bundles tab — links to Campaign Manager which handles bundle creation */}
          <Link
            to="/dashboard/campaigns"
            className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-transparent hover:border-orange-200 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-orange-400 w-16 h-16 rounded-bl-full opacity-10"></div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">🎁 Bundles</h2>
            <p className="text-gray-500 text-sm">Create product bundles and combo promotions for your shop.</p>
          </Link>

          {planAccess.isPro ? (
             <Link
               to="/dashboard/marketing"
               className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-transparent hover:border-indigo-100 relative overflow-hidden"
             >
               <div className="absolute top-0 right-0 bg-indigo-500 w-16 h-16 rounded-bl-full opacity-10"></div>
               <h2 className="text-lg font-semibold text-gray-800 mb-2">
                 🎨 Marketing Studio
               </h2>
               <p className="text-gray-500 text-sm">
                 Create ads, manage promo bundles, and generate QR-specific discounts.
               </p>
             </Link>
          ) : (
             <div
               onClick={() => setLockedFeatureFocus("Marketing Studio")}
               className="bg-gray-50 rounded-xl border border-gray-200 p-6 relative overflow-hidden cursor-pointer group"
             >
               <div className="absolute top-4 right-4 text-gray-400 group-hover:text-indigo-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
               </div>
               <h2 className="text-lg font-semibold text-gray-500 mb-2 transition-colors group-hover:text-gray-800">
                 🎨 Marketing Studio
               </h2>
               <p className="text-gray-400 text-sm">
                 Create ads, manage promo bundles, and generate QR-specific discounts.
               </p>
             </div>
          )}

          {/* B2B / Distribution Section - Restricted to Admins or Verified Wholesalers */}
          {(user?.role === 'system_admin' || shop?.plan === 'business') && (
            <>
              <Link
                to="/dashboard/connect-distribution"
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-transparent hover:border-indigo-100 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-indigo-600 w-16 h-16 rounded-bl-full opacity-10"></div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  📦 Distribution Connect
                </h2>
                <p className="text-gray-500 text-sm">
                  Discover verified wholesalers and order stock in bulk for your shop.
                </p>
              </Link>

              <Link
                to="/join/distribution-network"
                className="bg-indigo-50 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-transparent hover:border-indigo-200 relative overflow-hidden"
              >
                 <h2 className="text-lg font-semibold text-indigo-900 mb-2">
                   🤝 Partnership Gateway
                 </h2>
                 <p className="text-indigo-600/70 text-sm">
                   Apply to join the distribution network and sell bulk stock to other shops.
                 </p>
              </Link>

              <Link
                to="/dashboard/supply-mgmt"
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-transparent hover:border-slate-500 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 bg-slate-900 w-16 h-16 rounded-bl-full opacity-10"></div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  🚚 Supply Management
                </h2>
                <p className="text-gray-500 text-sm">
                  Wholesale distribution: List your products for other shops to buy.
                </p>
              </Link>
            </>
          )}

          {(user?.role === 'system_admin' || user?.role === 'delivery_manager' || user?.role === 'delivery_worker' || shop?.plan === 'business') && (
            <Link
              to="/dashboard/delivery"
              className="bg-slate-900 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-2 border-transparent hover:border-slate-500 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 bg-white/20 w-16 h-16 rounded-bl-full opacity-10 group-hover:scale-125 transition-transform"></div>
              <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                🚚 Delivery Hub
                <span className="bg-green-500 text-[10px] px-1.5 py-0.5 rounded text-white animate-pulse">Logistics</span>
              </h2>
              <p className="text-slate-400 text-sm">
                Manage last-mile logistics, track riders, and optimize delivery routes.
              </p>
            </Link>
          )}

          <Link
            to="/dashboard/finances"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border-2 border-transparent hover:border-indigo-100 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-indigo-600 w-16 h-16 rounded-bl-full opacity-10"></div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              💰 Accounting Hub
            </h2>
            <p className="text-gray-500 text-sm">
              Track revenue, expenses, and net profit from your sales and wholesale orders.
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
      </div>

        {/* Analytics Section */}
        <h2 id="analytics" className="text-lg font-bold text-gray-800 mb-4 pt-4">📊 Analytics</h2>

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
