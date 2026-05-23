import { lazy, Suspense, useEffect, useState, useMemo } from "react";
import { getShopBySubdomain } from "./services/shop-service";
import { supabase } from "./services/supabase-client";
import LoadingSpinner from "./components/LoadingSpinner";
import { Routes, Route, Navigate } from "react-router-dom";
import { useOfflineEventQueue } from "./hooks/useOfflineEventQueue";

// --- Always-eager: small guards/wrappers used on every render ---
import QrAccessGuard from "./components/QrAccessGuard";
import OfflineMenuWrapper from "./components/OfflineMenuWrapper";
import ComingSoonGuard from "./components/ComingSoonGuard";
import OnboardingGate from "./components/OnboardingGate";
import MaintenanceGate from "./components/MaintenanceGate";
import AuthGate from "./components/AuthGate";

// --- Public Pages (lazy) ---
const Home             = lazy(() => import("./pages/Home"));
const Enter            = lazy(() => import("./pages/Enter"));
const InvalidAccess    = lazy(() => import("./pages/InvalidAccess"));
const PublicQrLanding  = lazy(() => import("./pages/PublicQrLanding"));
const PublicShopProfile= lazy(() => import("./pages/PublicShopProfile"));
const RequestAccess    = lazy(() => import("./pages/RequestAccess"));
const Pricing          = lazy(() => import("./pages/Pricing"));
const AutoCart         = lazy(() => import("./pages/AutoCart"));
const CommunityFeed    = lazy(() => import("./pages/social/CommunityFeed"));
const Directory        = lazy(() => import("./pages/social/Directory"));
const Terms            = lazy(() => import("./pages/Terms"));
const Privacy          = lazy(() => import("./pages/Privacy"));
const About            = lazy(() => import("./pages/About"));
const Contact          = lazy(() => import("./pages/Contact"));
const Advertise        = lazy(() => import("./pages/Advertise"));
const ScanGateway      = lazy(() => import("./pages/ScanGateway"));
const Login            = lazy(() => import("./pages/Login"));
const Signup           = lazy(() => import("./pages/Signup"));
const ForgotPassword   = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword    = lazy(() => import("./pages/ResetPassword"));
const SupplierSignup   = lazy(() => import("./pages/SupplierSignup"));
const ShopSelection    = lazy(() => import("./pages/ShopSelection"));
const ProductDetails   = lazy(() => import("./pages/ProductDetails"));
const SalesMagazine    = lazy(() => import("./pages/SalesMagazine"));

// --- Customer Pages (lazy) ---
const Menu      = lazy(() => import("./pages/Menu"));
const CartPage  = lazy(() => import("./pages/CartPage"));
const Order     = lazy(() => import("./pages/Order"));
const Campaign  = lazy(() => import("./pages/Campaign"));
const TrackOrder= lazy(() => import("./pages/TrackOrder"));
const EditOrder = lazy(() => import("./pages/EditOrder"));
const MyOrders  = lazy(() => import("./pages/MyOrders"));

// --- Operator / Dashboard (lazy) ---
const DashboardRoutes  = lazy(() => import("./routes/DashboardRoutes"));
const ProductManager   = lazy(() => import("./pages/ProductManager"));
const BulkImageMapper  = lazy(() => import("./pages/BulkImageMapper"));
const QrGenerator      = lazy(() => import("./pages/QrGenerator"));
const Plans            = lazy(() => import("./pages/Plans"));

// --- Admin Pages (lazy — rarely visited, big files) ---
const MasterAdmin        = lazy(() => import("./pages/MasterAdmin"));
const Admin              = lazy(() => import("./pages/Admin"));
const AdminShops         = lazy(() => import("./pages/AdminShops"));
const AdminPlans         = lazy(() => import("./pages/AdminPlans"));
const AdminSEO           = lazy(() => import("./pages/AdminSEO"));
const AdminReport        = lazy(() => import("./pages/AdminReport"));
const AdminEngineering   = lazy(() => import("./pages/AdminEngineering"));
const AdminGlobalOrders  = lazy(() => import("./pages/AdminGlobalOrders"));
const AdminGlobalProducts= lazy(() => import("./pages/AdminGlobalProducts"));
const AdminMonitoring    = lazy(() => import("./pages/AdminMonitoring"));
const AdminSuppliers     = lazy(() => import("./pages/AdminSuppliers"));
const AdminAnalytics     = lazy(() => import("./pages/AdminAnalytics"));
const AdminTodo          = lazy(() => import("./pages/AdminTodo"));
const AdminBooklet       = lazy(() => import("./pages/AdminBooklet"));
const AdminPayouts       = lazy(() => import("./pages/AdminPayouts"));
const AdminIndustries    = lazy(() => import("./pages/AdminIndustries"));
const AdminGateway       = lazy(() => import("./pages/AdminGateway"));
const BusinessIntelligence= lazy(() => import("./pages/BusinessIntelligence"));
const SocialCommerce     = lazy(() => import("./pages/SocialCommerce"));
const DeveloperPortal    = lazy(() => import("./pages/DeveloperPortal"));
const WholesaleSalesSystem= lazy(() => import("./pages/WholesaleSalesSystem"));
const WholesaleJourneyMap = lazy(() => import("./pages/WholesaleJourneyMap"));
const SeedWholesaleUser   = lazy(() => import("./pages/SeedWholesaleUser"));

// Dynamic legacy admin link redirect helper
function AdminRedirect() {
  const target = window.location.pathname.replace(/^\/admin/, '/a/admin');
  return <Navigate to={target} replace />;
}

// Page-transition fallback — minimal spinner so users see something immediately
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const [systemState, setSystemState] = useState(() => {
    // Hotload: public paths on the main domain don't need to block for resolution
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const parts = hostname.split('.');
    const isSubdomain = parts.length >= 3 && parts[0] !== 'www' && !hostname.includes('vercel.app');
    const isLocalSubdomain = hostname === 'localhost' ? false : (hostname.includes('localhost') && parts.length >= 2);
    const publicPaths = ['/', '/pricing', '/login', '/signup', '/terms', '/privacy', '/about', '/contact', '/request-access'];
    const isPublicPath = typeof window !== 'undefined' && publicPaths.includes(window.location.pathname);
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
    return (
      <Suspense fallback={<PageLoader />}>
        <PublicShopProfile directShopId={subdomainShopId} />
      </Suspense>
    );
  }

  return (
    <MaintenanceGate preFetchedMaintenance={maintenance}>
      <Suspense fallback={<PageLoader />}>
      <Routes>
      {/* === PUBLIC ROUTES === */}
      <Route path="/" element={<Home />} />
      <Route path="/enter" element={<Enter />} />
      <Route path="/invalid-access" element={<InvalidAccess />} />
      <Route path="/shops/:shopId" element={<PublicShopProfile />} />
      <Route path="/s/:shopId" element={<PublicShopProfile />} />
      <Route path="/product/:productId" element={<ProductDetails />} />
      <Route path="/s/:identifier/magazine" element={<SalesMagazine />} />

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
      <Route path="/track/:orderId" element={<TrackOrder />} />
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
      <Route path="/admin" element={<Navigate to="/a/admin" replace />} />
      <Route path="/admin/*" element={<AdminRedirect />} />

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
      </Suspense>
    </MaintenanceGate>
  );
}
