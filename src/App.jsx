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
import Dashboard from "./pages/Dashboard";
import MenuManager from "./pages/MenuManager";
import QrGenerator from "./pages/QrGenerator";
import DashboardIndex from "./pages/dashboard/index";
import QRAnalytics from "./pages/dashboard/qr-detail";
import ScanGateway from "./pages/ScanGateway";
import Plans from "./pages/Plans";
import Admin from "./pages/Admin";
import AdminShops from "./pages/AdminShops";
import AdminPlans from "./pages/AdminPlans";
import Campaign from "./pages/Campaign";
import TrackOrder from "./pages/TrackOrder";
import OrderManager from "./pages/OrderManager";
import MyOrders from "./pages/MyOrders";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/enter" element={<Enter />} />
      <Route path="/invalid-access" element={<InvalidAccess />} />
      
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
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/menu-manager" element={<MenuManager />} />
      <Route path="/dashboard/qrs" element={<DashboardIndex />} />
      <Route path="/dashboard/qrs/:qrId" element={<QRAnalytics />} />
      <Route path="/qr-generator" element={<QrGenerator />} />
      <Route path="/plans" element={<Plans />} />

      {/* Admin */}
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin/shops" element={<AdminShops />} />
      <Route path="/admin/plans" element={<AdminPlans />} />
    </Routes>
  );
}
