import { useEffect, useState } from "react";
import { getShopBySubdomain } from "./services/shop-service";
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
import MasterAdmin from "./pages/MasterAdmin";
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
import AdminGateway from "./pages/AdminGateway";
import DeveloperPortal from "./pages/DeveloperPortal";
import WholesaleSalesSystem from "./pages/WholesaleSalesSystem";
import WholesaleJourneyMap from "./pages/WholesaleJourneyMap";
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
import SeedWholesaleUser from "./pages/SeedWholesaleUser";
import Signup from "./pages/Signup";

// Delivery Hub
import DeliveryPortal from "./pages/DeliveryPortal";
import DeliveryWorker from "./pages/DeliveryWorker";
import DeliveryDashboard from "./pages/DeliveryDashboard";

import { useOfflineEventQueue } from "./hooks/useOfflineEventQueue";

export default function App() {
  const [subdomainShopId, setSubdomainShopId] = useState(null);
  const [resolving, setResolving] = useState(true);

  useOfflineEventQueue();

  useEffect(() => {
    document.title = "ShopQR | Instant WhatsApp Menus & Ordering";

    async function resolveSubdomain() {
      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      
      // Logic: If on a subdomain (e.g., shop123.shopqr.com or shop123.localhost)
      // but NOT the main domain (e.g. tmsavannah.com)
      const isLocal = hostname === 'localhost' || hostname.includes('127.0.0.1');
      const isVercel = hostname.includes('vercel.app');
      
      // Basic extraction: if there are 3 parts (shop.tmsavannah.com) or 2 parts on localhost (shop.localhost)
      let subdomain = null;
      if (!isLocal && !isVercel && parts.length >= 3) {
         subdomain = parts[0];
      } else if (isLocal && parts.length >= 2) {
         subdomain = parts[0];
      }

      if (subdomain && subdomain !== 'www') {
         // Security Layer: Resolution Cache (sessionStorage)
         const cachedId = sessionStorage.getItem(`subdomain_cache_${subdomain}`);
         if (cachedId) {
            setSubdomainShopId(cachedId);
            setResolving(false);
            return;
         }

         try {
            const shop = await getShopBySubdomain(subdomain);
            if (shop) {
               // Strict Security Validation: Ensure shop.id is a valid UUID v4
               const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
               if (uuidRegex.test(shop.id)) {
                  setSubdomainShopId(shop.id);
                  sessionStorage.setItem(`subdomain_cache_${subdomain}`, shop.id);
               } else {
                  console.error("Security Incident: Malformed Shop ID received from resolution.");
               }
            } else {
               // UNKNOWN SUBDOMAIN: Ensure the resolver falls back to the main homepage
               // by leaving subdomainShopId as null.
               console.warn(`Routing Notice: Subdomain "${subdomain}" not recognized. Redirecting internal resolution to main platform Home.`);
            }
         } catch (e) {
            console.error("Subdomain Resolution Failed:", e);
         }
      }
      setResolving(false);
    }
    resolveSubdomain();
  }, []);

  if (resolving) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="animate-spin h-8 w-8 border-b-2 border-green-600 rounded-full"></div></div>;

  if (subdomainShopId && window.location.pathname === "/") {
     return <PublicShopProfile directShopId={subdomainShopId} />;
  }

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
      <Route path="/signup" element={<Signup />} />
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
      <Route path="/admin" element={<MasterAdmin />} />
      <Route path="/admin/ops" element={<Admin />} />
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
      <Route path="/admin/gateway" element={<AdminGateway />} />
      <Route path="/developer/portal" element={<DeveloperPortal />} />
      <Route path="/developer/wholesale" element={<WholesaleSalesSystem />} />
      <Route path="/developer/journey" element={<WholesaleJourneyMap />} />
      <Route path="/developer/seed-wholesale" element={<SeedWholesaleUser />} />

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
