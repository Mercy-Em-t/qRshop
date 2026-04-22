import { useEffect, useState } from "react";
import { getShopBySubdomain } from "./services/shop-service";
import { Routes, Route } from "react-router-dom";
import PublicShopProfile from "./pages/PublicShopProfile";
import { useOfflineEventQueue } from "./hooks/useOfflineEventQueue";

// --- Public Pages ---
import Home from "./pages/Home";
import Enter from "./pages/Enter";
import InvalidAccess from "./pages/InvalidAccess";
import PublicQrLanding from "./pages/PublicQrLanding";
import RequestAccess from "./pages/RequestAccess";
import Pricing from "./pages/Pricing";
import AutoCart from "./pages/AutoCart";
import CommunityFeed from "./pages/social/CommunityFeed";
import Directory from "./pages/social/Directory";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Advertise from "./pages/Advertise";
import ScanGateway from "./pages/ScanGateway";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SupplierSignup from "./pages/SupplierSignup";

// --- Customer Pages ---
import QrAccessGuard from "./components/QrAccessGuard";
import OfflineMenuWrapper from "./components/OfflineMenuWrapper";
import ComingSoonGuard from "./components/ComingSoonGuard";
import Menu from "./pages/Menu";
import CartPage from "./pages/CartPage";
import Order from "./pages/Order";
import Campaign from "./pages/Campaign";
import TrackOrder from "./pages/TrackOrder";
import EditOrder from "./pages/EditOrder";
import MyOrders from "./pages/MyOrders";

// --- Operator Pages ---
import OnboardingGate from "./components/OnboardingGate";
import MaintenanceGate from "./components/MaintenanceGate";
import ProductManager from "./pages/ProductManager";
import ShopSelection from "./pages/ShopSelection";
import QrGenerator from "./pages/QrGenerator";
import Plans from "./pages/Plans";

// --- Dashboard Pages ---
import DashboardRoutes from "./routes/DashboardRoutes";

// --- Admin Pages ---
import MasterAdmin from "./pages/MasterAdmin";
import Admin from "./pages/Admin";
import AdminShops from "./pages/AdminShops";
import AdminPlans from "./pages/AdminPlans";
import AdminSEO from "./pages/AdminSEO";
import AdminReport from "./pages/AdminReport";
import AdminEngineering from "./pages/AdminEngineering";
import AdminGlobalOrders from "./pages/AdminGlobalOrders";
import AdminGlobalProducts from "./pages/AdminGlobalProducts";
import AdminMonitoring from "./pages/AdminMonitoring";
import AdminSuppliers from "./pages/AdminSuppliers";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminTodo from "./pages/AdminTodo";
import AdminBooklet from "./pages/AdminBooklet";
import AdminPayouts from "./pages/AdminPayouts";
import AdminIndustries from "./pages/AdminIndustries";
import AdminGateway from "./pages/AdminGateway";
import BusinessIntelligence from "./pages/BusinessIntelligence";
import SocialCommerce from "./pages/SocialCommerce";
import DeveloperPortal from "./pages/DeveloperPortal";
import WholesaleSalesSystem from "./pages/WholesaleSalesSystem";
import WholesaleJourneyMap from "./pages/WholesaleJourneyMap";
import SeedWholesaleUser from "./pages/SeedWholesaleUser";
import ProductDetails from "./pages/ProductDetails";

export default function App() {
  const [subdomainShopId, setSubdomainShopId] = useState(null);
  const [resolving, setResolving] = useState(true);

  useOfflineEventQueue();

  useEffect(() => {
    document.title = "The Modern Savannah";

    async function resolveSubdomain() {
      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      
      const isLocal = hostname === 'localhost' || hostname.includes('127.0.0.1');
      const isVercel = hostname.includes('vercel.app');
      
      let subdomain = null;
      if (!isLocal && !isVercel && parts.length >= 3) {
         subdomain = parts[0];
      } else if (isLocal && parts.length >= 2) {
         subdomain = parts[0];
      }

      if (subdomain && subdomain !== 'www') {
         const cachedId = sessionStorage.getItem(`subdomain_cache_${subdomain}`);
         if (cachedId) {
            setSubdomainShopId(cachedId);
            setResolving(false);
            return;
         }

         try {
            const shop = await getShopBySubdomain(subdomain);
            if (shop) {
               const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
               if (uuidRegex.test(shop.id)) {
                  setSubdomainShopId(shop.id);
                  sessionStorage.setItem(`subdomain_cache_${subdomain}`, shop.id);
               } else {
                  console.error("Security Incident: Malformed Shop ID received from resolution.");
               }
            } else {
               console.warn(`Routing Notice: Subdomain "${subdomain}" not recognized.`);
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
    <MaintenanceGate>
      <Routes>
      {/* === PUBLIC ROUTES === */}
      <Route path="/" element={<Home />} />
      <Route path="/enter" element={<Enter />} />
      <Route path="/invalid-access" element={<InvalidAccess />} />
      <Route path="/shops/:shopId" element={<PublicShopProfile />} />
      <Route path="/s/:shopId" element={<PublicShopProfile />} />
      <Route path="/product/:productId" element={<ProductDetails />} />

      <Route path="/qr/:qrId" element={<PublicQrLanding />} />
      <Route path="/request-access" element={<RequestAccess />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/buy/:itemName" element={<AutoCart />} />
      <Route path="/buy" element={<AutoCart />} />
      <Route path="/auto-cart" element={<AutoCart />} />
      <Route path="/community" element={<ComingSoonGuard title="Community Hub"><CommunityFeed /></ComingSoonGuard>} />
      <Route path="/explore" element={<ComingSoonGuard title="Marketplace"><Directory /></ComingSoonGuard>} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/q/:qrId" element={<ScanGateway />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/join/distribution-network" element={<SupplierSignup />} />
      <Route path="/shop-selection" element={<ShopSelection />} />

      {/* === CUSTOMER ROUTES === */}
      <Route path="/menu" element={<QrAccessGuard><OfflineMenuWrapper><Menu /></OfflineMenuWrapper></QrAccessGuard>} />
      <Route path="/cart" element={<QrAccessGuard><CartPage /></QrAccessGuard>} />
      <Route path="/order" element={<QrAccessGuard><Order /></QrAccessGuard>} />
      <Route path="/campaign" element={<QrAccessGuard><Campaign /></QrAccessGuard>} />
      <Route path="/track/:orderId" element={<QrAccessGuard><TrackOrder /></QrAccessGuard>} />
      <Route path="/edit/:orderId" element={<QrAccessGuard><EditOrder /></QrAccessGuard>} />
      <Route path="/history" element={<QrAccessGuard><MyOrders /></QrAccessGuard>} />

      {/* === OPERATOR ROUTES === */}
      <Route path="/product-manager" element={<OnboardingGate><ProductManager /></OnboardingGate>} />
      <Route path="/menu-manager" element={<OnboardingGate><ProductManager /></OnboardingGate>} />
      <Route path="/qr-generator" element={<OnboardingGate><QrGenerator /></OnboardingGate>} />
      <Route path="/plans" element={<OnboardingGate><Plans /></OnboardingGate>} />

      {/* === DASHBOARD ROUTES === */}
      <Route path="/dashboard/*" element={<DashboardRoutes />} />

      {/* === ADMIN ROUTES === */}
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
      <Route path="/admin/monitoring" element={<AdminMonitoring />} />
      <Route path="/admin/suppliers" element={<AdminSuppliers />} />
      <Route path="/admin/analytics" element={<AdminAnalytics />} />
      <Route path="/admin/todo" element={<AdminTodo />} />
      <Route path="/admin/booklet" element={<AdminBooklet />} />
      <Route path="/admin/payouts" element={<AdminPayouts />} />
      <Route path="/admin/industries" element={<AdminIndustries />} />
      <Route path="/admin/gateway" element={<AdminGateway />} />
      <Route path="/admin/intelligence" element={<BusinessIntelligence />} />
      <Route path="/social/commerce" element={<ComingSoonGuard title="Social Commerce Studio"><SocialCommerce /></ComingSoonGuard>} />
      <Route path="/developer/portal" element={<DeveloperPortal />} />
      <Route path="/developer/wholesale" element={<WholesaleSalesSystem />} />
      <Route path="/developer/journey" element={<WholesaleJourneyMap />} />
      <Route path="/developer/seed-wholesale" element={<SeedWholesaleUser />} />

      {/* === 404 FALLBACK === */}
      <Route path="*" element={
         <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4">
            <h1 className="text-4xl mb-4">🧭</h1>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h2>
            <p className="text-gray-500 mb-6">The link you followed may be broken.</p>
            <a href="/" className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition">Return Home</a>
         </div>
      } />
      </Routes>
    </MaintenanceGate>
  );
}
