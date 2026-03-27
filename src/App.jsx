import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import QrAccessGuard from "./components/QrAccessGuard";
import OfflineMenuWrapper from "./components/OfflineMenuWrapper";
import OnboardingGate from "./components/OnboardingGate";
import Home from "./pages/Home";
import Enter from "./pages/Enter";
import Menu from "./pages/Menu";
import CartPage from "./pages/CartPage";
import Order from "./pages/Order";
import InvalidAccess from "./pages/InvalidAccess";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import MenuManager from "./pages/MenuManager";
import QrGenerator from "./pages/QrGenerator";
import QrDashboard from "./pages/QrDashboard";
import QRAnalytics from "./pages/dashboard/qr-detail";
import DynamicQrSettings from "./pages/dashboard/DynamicQrSettings";
import ScanGateway from "./pages/ScanGateway";
import Plans from "./pages/Plans";
import Admin from "./pages/Admin";
import AdminShops from "./pages/AdminShops";
import AdminPlans from "./pages/AdminPlans";
import AdminSEO from "./pages/AdminSEO";
import AdminReport from "./pages/AdminReport";
import AdminEngineering from "./pages/AdminEngineering";
import AdminGlobalOrders from "./pages/AdminGlobalOrders";
import AdminGlobalProducts from "./pages/AdminGlobalProducts";
import AdminMonitoring from "./pages/AdminMonitoring";
import SupplierSignup from "./pages/SupplierSignup";
import AdminSuppliers from "./pages/AdminSuppliers";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminTodo from "./pages/AdminTodo";
import AdminBooklet from "./pages/AdminBooklet";
import AdminPayouts from "./pages/AdminPayouts";
import AdminIndustries from "./pages/AdminIndustries";
import Campaign from "./pages/Campaign";
import TrackOrder from "./pages/TrackOrder";
import EditOrder from "./pages/EditOrder";
import OrderManager from "./pages/OrderManager";
import MyOrders from "./pages/MyOrders";
import MarketingStudio from "./pages/MarketingStudio";
import CampaignManager from "./pages/CampaignManager";
import PublicShopProfile from "./pages/PublicShopProfile";
import PublicQrLanding from "./pages/PublicQrLanding";
import Settings from "./pages/Settings";
import RequestAccess from "./pages/RequestAccess";
import AutoCart from "./pages/AutoCart";
// Social & Community Integration
import CommunityFeed from "./pages/social/CommunityFeed";
import Directory from "./pages/social/Directory";
import SupplierPortal from "./pages/SupplierPortal";
import SupplierDirectory from "./pages/SupplierDirectory";
import ShopFinances from "./pages/ShopFinances";
// Generic Legal Pages (Public)
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import About from './pages/About';
import Contact from './pages/Contact';
import Advertise from './pages/Advertise';

// Delivery Hub
import DeliveryPortal from "./pages/DeliveryPortal";
import DeliveryWorker from "./pages/DeliveryWorker";
import DeliveryDashboard from "./pages/DeliveryDashboard";

import { useOfflineEventQueue } from "./hooks/useOfflineEventQueue";

export default function App() {
  useOfflineEventQueue();
  useEffect(() => {
    document.title = "ShopQR | Instant WhatsApp Menus & Ordering";
  }, []);
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/enter" element={<Enter />} />
      <Route path="/invalid-access" element={<InvalidAccess />} />
      <Route path="/shops/:shopId" element={<PublicShopProfile />} />
      <Route path="/qr/:qrId" element={<PublicQrLanding />} />
      <Route path="/request-access" element={<RequestAccess />} />
      <Route path="/buy/:itemName" element={<AutoCart />} />
      <Route path="/buy" element={<AutoCart />} />
      <Route path="/auto-cart" element={<AutoCart />} />
      
      {/* Social Sub-Platform */}
      <Route path="/community" element={<CommunityFeed />} />
      <Route path="/explore" element={<Directory />} />
      
      {/* Legal Pages */}
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/advertise" element={<Advertise />} />

      {/* Platform Level QR Scanning Node */}
      <Route path="/q/:qrId" element={<ScanGateway />} />

      {/* Customer (QR session required) */}
      <Route
        path="/menu"
        element={
          <QrAccessGuard>
            <OfflineMenuWrapper>
              <Menu />
            </OfflineMenuWrapper>
          </QrAccessGuard>
        }
      />
      <Route
        path="/cart"
        element={
          <QrAccessGuard>
            <CartPage />
          </QrAccessGuard>
        }
      />
      <Route
        path="/order"
        element={
          <QrAccessGuard>
            <Order />
          </QrAccessGuard>
        }
      />
      <Route
        path="/campaign"
        element={
          <QrAccessGuard>
            <Campaign />
          </QrAccessGuard>
        }
      />
      <Route
        path="/track/:orderId"
        element={
          <QrAccessGuard>
            <TrackOrder />
          </QrAccessGuard>
        }
      />
      <Route
        path="/edit/:orderId"
        element={
          <QrAccessGuard>
            <EditOrder />
          </QrAccessGuard>
        }
      />
      <Route
        path="/history"
        element={
          <QrAccessGuard>
            <MyOrders />
          </QrAccessGuard>
        }
      />

      {/* Shop Dashboard */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      
      {/* Secured & Onboarded Operator Routes */}
      <Route 
         path="/dashboard/*" 
         element={
            <OnboardingGate>
               <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="analytics" element={<Navigate to="/dashboard#analytics" replace />} />
                  <Route path="orders" element={<OrderManager />} />
                  <Route path="qrs" element={<QrDashboard />} />
                  <Route path="qrs/:qrId" element={<QRAnalytics />} />
                  <Route path="qrs/:qrId/settings" element={<DynamicQrSettings />} />
                  <Route path="campaigns" element={<CampaignManager />} />
                  <Route path="marketing" element={<MarketingStudio />} />
                  <Route path="supply-mgmt" element={<SupplierPortal />} />
                  <Route path="connect-distribution" element={<SupplierDirectory />} />
                  <Route path="finances" element={<ShopFinances />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="delivery" element={<DeliveryPortal />} />
                  <Route path="delivery/worker" element={<DeliveryWorker />} />
                  <Route path="delivery/manager" element={<DeliveryDashboard />} />
                </Routes>
            </OnboardingGate>
         } 
      />
      
      <Route path="/menu-manager" element={<OnboardingGate><MenuManager /></OnboardingGate>} />
      <Route path="/qr-generator" element={<OnboardingGate><QrGenerator /></OnboardingGate>} />
      <Route path="/plans" element={<OnboardingGate><Plans /></OnboardingGate>} />

      {/* Superuser Admin Routes */}
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin/shops" element={<AdminShops />} />
      <Route path="/admin/plans" element={<AdminPlans />} />
      <Route path="/admin/seo" element={<AdminSEO />} />
      <Route path="/admin/report" element={<AdminReport />} />
      <Route path="/admin/engineering" element={<AdminEngineering />} />
      <Route path="/admin/global-orders" element={<AdminGlobalOrders />} />
      <Route path="/admin/global-products" element={<AdminGlobalProducts />} />
      <Route path="/monitoring" element={<AdminMonitoring />} />
      <Route path="/join/distribution-network" element={<SupplierSignup />} />
      <Route path="/admin/suppliers" element={<AdminSuppliers />} />
      <Route path="/admin/analytics" element={<AdminAnalytics />} />
      <Route path="/admin/todo" element={<AdminTodo />} />
      <Route path="/admin/booklet" element={<AdminBooklet />} />
      <Route path="/admin/payouts" element={<AdminPayouts />} />
      <Route path="/admin/industries" element={<AdminIndustries />} />

      {/* Fallback 404 to explicitly prevent blank white screens on invalid paths */}
      <Route path="*" element={
         <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4">
            <h1 className="text-4xl mb-4">🧭</h1>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h2>
            <p className="text-gray-500 mb-6">The link you followed may be broken or the page may have been removed.</p>
            <a href="/" className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition">Return Home</a>
         </div>
      } />
    </Routes>
  );
}
