import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import OnboardingGate from "../components/OnboardingGate";

// Dashboard sub-pages — each downloads as a separate chunk when first visited
const Dashboard          = lazy(() => import("../pages/Dashboard"));
const OrderManager       = lazy(() => import("../pages/OrderManager"));
const QrDashboard        = lazy(() => import("../pages/QrDashboard"));
const QRAnalytics        = lazy(() => import("../pages/dashboard/qr-detail"));
const DynamicQrSettings  = lazy(() => import("../pages/dashboard/DynamicQrSettings"));
const CampaignManager    = lazy(() => import("../pages/CampaignManager"));
const MarketingStudio    = lazy(() => import("../pages/MarketingStudio"));
const SupplierPortal     = lazy(() => import("../pages/SupplierPortal"));
const SupplierDirectory  = lazy(() => import("../pages/SupplierDirectory"));
const ShopFinances       = lazy(() => import("../pages/ShopFinances"));
const Settings           = lazy(() => import("../pages/Settings"));
const DeliveryPortal     = lazy(() => import("../pages/DeliveryPortal"));
const DeliveryWorker     = lazy(() => import("../pages/DeliveryWorker"));
const DeliveryDashboard  = lazy(() => import("../pages/DeliveryDashboard"));
const TemplateSettings   = lazy(() => import("../pages/TemplateSettings"));
const ProductManager     = lazy(() => import("../pages/ProductManager"));
const ManageAttributes   = lazy(() => import("../pages/ManageAttributes"));
const SalesBrainManager  = lazy(() => import("../pages/SalesBrainManager"));
const BulkImageMapper    = lazy(() => import("../pages/BulkImageMapper"));
const SubscriptionPage   = lazy(() => import("../pages/SubscriptionPage"));
const ShopAppearance      = lazy(() => import("../pages/ShopAppearance"));

// Minimal spinner for route transitions within the dashboard
function DashboardPageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-7 h-7 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function DashboardRoutes() {
  const location = useLocation();

  return (
    <OnboardingGate>
      <Suspense fallback={<DashboardPageLoader />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="analytics" element={<Navigate to="/a#analytics" replace />} />
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
          <Route path="templates" element={<TemplateSettings />} />
          <Route path="products" element={<ProductManager />} />
          <Route path="attributes" element={<ManageAttributes />} />
          <Route path="ai-brain" element={<SalesBrainManager />} />
          <Route path="bulk-image-mapper" element={<BulkImageMapper />} />
          <Route path="subscription" element={<SubscriptionPage />} />
          <Route path="appearance" element={<ShopAppearance />} />
        </Routes>
      </Suspense>
    </OnboardingGate>
  );
}
