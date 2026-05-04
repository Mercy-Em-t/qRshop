import { Routes, Route, Navigate, useLocation, Link } from "react-router-dom";
import OnboardingGate from "../components/OnboardingGate";
import Dashboard from "../pages/Dashboard";
import OrderManager from "../pages/OrderManager";
import QrDashboard from "../pages/QrDashboard";
import QRAnalytics from "../pages/dashboard/qr-detail";
import DynamicQrSettings from "../pages/dashboard/DynamicQrSettings";
import CampaignManager from "../pages/CampaignManager";
import MarketingStudio from "../pages/MarketingStudio";
import SupplierPortal from "../pages/SupplierPortal";
import SupplierDirectory from "../pages/SupplierDirectory";
import ShopFinances from "../pages/ShopFinances";
import Settings from "../pages/Settings";
import DeliveryPortal from "../pages/DeliveryPortal";
import DeliveryWorker from "../pages/DeliveryWorker";
import DeliveryDashboard from "../pages/DeliveryDashboard";
import TemplateSettings from "../pages/TemplateSettings";
import ProductManager from "../pages/ProductManager";
import ManageAttributes from "../pages/ManageAttributes";
import SalesBrainManager from "../pages/SalesBrainManager";
import BulkImageMapper from "../pages/BulkImageMapper";
import SubscriptionPage from "../pages/SubscriptionPage";
import ShopAppearance from "../pages/ShopAppearance";

export default function DashboardRoutes() {
  const location = useLocation();
  const isSubpage = location.pathname !== "/a" && location.pathname !== "/a/";

  return (
    <OnboardingGate>
      {isSubpage && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3.5 flex items-center justify-between sticky top-0 z-[100] transition-all select-none">
          <Link to="/a" className="text-xs font-black uppercase tracking-widest text-indigo-600 flex items-center gap-1.5 hover:opacity-80">
            ← Dashboard
          </Link>
          <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full font-black tracking-widest uppercase border border-indigo-100">
            {location.pathname.split("/").pop()?.replace(/-/g, " ") || "subpage"}
          </span>
        </div>
      )}
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
    </OnboardingGate>
  );
}
