import { useEffect, useState, useMemo } from "react";
import { getShopBySubdomain } from "./services/shop-service";
import { supabase } from "./services/supabase-client";
import LoadingSpinner from "./components/LoadingSpinner";
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

// --- Dashboard Routes ---
import DashboardRoutes from "./routes/DashboardRoutes";
import BulkImageMapper from "./pages/BulkImageMapper";
import AuthGate from "./components/AuthGate";
import { Navigate } from "react-router-dom";

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
  const [systemState, setSystemState] = useState(() => {
    // Determine if we can "Hotload" this page
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const parts = hostname.split('.');
    const isSubdomain = parts.length >= 3 && parts[0] !== 'www' && !hostname.includes('vercel.app');
    const isLocalSubdomain = hostname === 'localhost' ? false : (hostname.includes('localhost') && parts.length >= 2);
    
    const publicPaths = ['/', '/pricing', '/login', '/signup', '/terms', '/privacy', '/about', '/contact', '/request-access'];
    const isPublicPath = typeof window !== 'undefined' && publicPaths.includes(window.location.pathname);
    
    // If it's a public path on the main domain, we don't need to block for resolution
    const canHotload = isPublicPath && !isSubdomain && !isLocalSubdomain;

    return {
      maintenance: null,
      resolving: !canHotload,
      subdomainShopId: null
    };
  });

  useOfflineEventQueue();

  useEffect(() => {
    document.title = "The Modern Savannah";

    async function initializeSystem() {
      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      const isLocal = hostname === 'localhost' || hostname.includes('127.0.0.1');
      const isVercel = hostname.includes('vercel.app');
      
      let subdomain = null;
      if (!isLocal && !isVercel && parts.length >= 3) subdomain = parts[0];
      else if (isLocal && parts.length >= 2) subdomain = parts[0];

      try {
        // Parallelized System Checks
        const [maintenanceRes, shopRes] = await Promise.all([
          // 1. Maintenance Check (Background)
          supabase
            .from("system_config")
            .select("config_value")
            .eq("config_key", "maintenance_mode")
            .maybeSingle(),
          
          // 2. Subdomain Resolution (Background)
          subdomain && subdomain !== 'www' 
            ? getShopBySubdomain(subdomain)
            : Promise.resolve(null)
        ]);

        let resolvedShopId = null;
        if (shopRes) {
          resolvedShopId = shopRes.id;
          sessionStorage.setItem(`subdomain_cache_${subdomain}`, resolvedShopId);
        }

        setSystemState({
          maintenance: maintenanceRes?.data?.config_value || null,
          resolving: false,
          subdomainShopId: resolvedShopId
        });
      } catch (e) {
        console.error("System Initialization Failed:", e);
        setSystemState(prev => ({ ...prev, resolving: false }));
      }
    }
    initializeSystem();
  }, []);

  const isDebug = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('debug') === 'true' || localStorage.getItem('tms_debug') === 'true';
  }, []);

  if (systemState.resolving) {
    return (
      <LoadingSpinner 
        showLogo={true} 
        message={isDebug ? "Establishing Secure Connection..." : "Synchronizing Platform..."} 
        fullPage={true} 
      />
    );
  }

  const { subdomainShopId, maintenance } = systemState;

  if (subdomainShopId && window.location.pathname === "/") {
     return <PublicShopProfile directShopId={subdomainShopId} />;
  }

  return (
    <MaintenanceGate preFetchedMaintenance={maintenance}>
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

      {/* === PROTECTED ACCOUNT ROUTES === */}
      <Route path="/a/*" element={<AuthGate><DashboardRoutes /></AuthGate>} />
      
      {/* Legacy Redirects */}
      <Route path="/dashboard/*" element={<Navigate to="/a" replace />} />
      <Route path="/product-manager" element={<Navigate to="/a/products" replace />} />
      <Route path="/menu-manager" element={<Navigate to="/a/settings" replace />} />
      <Route path="/qr-generator" element={<Navigate to="/a/qrs" replace />} />
      <Route path="/plans" element={<Navigate to="/a/settings" replace />} />

      {/* === ADMIN ROUTES (Now nested under /a/ if possible, or kept separate but gated) === */}
      {/* For now, keeping them simple but they should ideally be inside DashboardRoutes or prefixed with /a/admin */}
      <Route path="/a/admin" element={<AuthGate><MasterAdmin /></AuthGate>} />
      <Route path="/a/admin/ops" element={<AuthGate><Admin /></AuthGate>} />
      <Route path="/a/admin/shops" element={<AuthGate><AdminShops /></AuthGate>} />
      <Route path="/a/admin/plans" element={<AuthGate><AdminPlans /></AuthGate>} />
      <Route path="/a/admin/seo" element={<AuthGate><AdminSEO /></AuthGate>} />
      <Route path="/a/admin/report" element={<AuthGate><AdminReport /></AuthGate>} />
      <Route path="/a/admin/engineering" element={<AuthGate><AdminEngineering /></AuthGate>} />
      <Route path="/a/admin/global-orders" element={<AuthGate><AdminGlobalOrders /></AuthGate>} />
      <Route path="/a/admin/global-products" element={<AuthGate><AdminGlobalProducts /></AuthGate>} />
      <Route path="/a/admin/monitoring" element={<AuthGate><AdminMonitoring /></AuthGate>} />
      <Route path="/a/admin/suppliers" element={<AuthGate><AdminSuppliers /></AuthGate>} />
      <Route path="/a/admin/analytics" element={<AuthGate><AdminAnalytics /></AuthGate>} />
      <Route path="/a/admin/todo" element={<AuthGate><AdminTodo /></AuthGate>} />
      <Route path="/a/admin/booklet" element={<AuthGate><AdminBooklet /></AuthGate>} />
      <Route path="/a/admin/payouts" element={<AuthGate><AdminPayouts /></AuthGate>} />
      <Route path="/a/admin/industries" element={<AuthGate><AdminIndustries /></AuthGate>} />
      <Route path="/a/admin/gateway" element={<AuthGate><AdminGateway /></AuthGate>} />
      <Route path="/a/admin/intelligence" element={<AuthGate><BusinessIntelligence /></AuthGate>} />
      
      {/* Developer Portal (Gated) */}
      <Route path="/a/developer/portal" element={<AuthGate><DeveloperPortal /></AuthGate>} />
      <Route path="/a/developer/wholesale" element={<AuthGate><WholesaleSalesSystem /></AuthGate>} />
      <Route path="/a/developer/journey" element={<AuthGate><WholesaleJourneyMap /></AuthGate>} />
      <Route path="/a/developer/seed-wholesale" element={<AuthGate><SeedWholesaleUser /></AuthGate>} />

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
