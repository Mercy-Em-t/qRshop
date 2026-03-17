import { Routes, Route } from "react-router-dom";
import QrAccessGuard from "./components/QrAccessGuard";
import OfflineMenuWrapper from "./components/OfflineMenuWrapper";
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
import ScanGateway from "./pages/ScanGateway";
import Plans from "./pages/Plans";
import Admin from "./pages/Admin";
import AdminShops from "./pages/AdminShops";
import AdminPlans from "./pages/AdminPlans";
import AdminSEO from "./pages/AdminSEO";
import AdminReport from "./pages/AdminReport";
import AdminEngineering from "./pages/AdminEngineering";
import Campaign from "./pages/Campaign";
import TrackOrder from "./pages/TrackOrder";
import OrderManager from "./pages/OrderManager";
import MyOrders from "./pages/MyOrders";
import MarketingStudio from "./pages/MarketingStudio";
import CampaignManager from "./pages/CampaignManager";
import PublicShopProfile from "./pages/PublicShopProfile";
import PublicQrLanding from "./pages/PublicQrLanding";
import { useOfflineEventQueue } from "./hooks/useOfflineEventQueue";

export default function App() {
  useOfflineEventQueue();
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/enter" element={<Enter />} />
      <Route path="/invalid-access" element={<InvalidAccess />} />
      <Route path="/shops/:shopId" element={<PublicShopProfile />} />
      <Route path="/qr/:qrId" element={<PublicQrLanding />} />
      
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
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/dashboard/orders" element={<OrderManager />} />
      <Route path="/menu-manager" element={<MenuManager />} />
      <Route path="/dashboard/qrs" element={<QrDashboard />} />
      <Route path="/dashboard/qrs/:qrId" element={<QRAnalytics />} />
      <Route path="/dashboard/campaigns" element={<CampaignManager />} />
      <Route path="/qr-generator" element={<QrGenerator />} />
      <Route path="/dashboard/marketing" element={<MarketingStudio />} />
      <Route path="/plans" element={<Plans />} />

      {/* Superuser Admin Routes */}
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin/shops" element={<AdminShops />} />
      <Route path="/admin/plans" element={<AdminPlans />} />
      <Route path="/admin/seo" element={<AdminSEO />} />
      <Route path="/admin/report" element={<AdminReport />} />
      <Route path="/admin/engineering" element={<AdminEngineering />} />
    </Routes>
  );
}
