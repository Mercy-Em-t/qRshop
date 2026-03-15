import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import QRAccessGuard from './components/qr-access-guard'

const Enter = lazy(() => import('./pages/enter'))
const Menu = lazy(() => import('./pages/menu'))
const CartPage = lazy(() => import('./pages/cart'))
const Order = lazy(() => import('./pages/order'))
const Dashboard = lazy(() => import('./pages/dashboard'))
const Admin = lazy(() => import('./pages/admin'))
const InvalidAccess = lazy(() => import('./pages/invalid-access'))

function App() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            Loading...
          </div>
        }
      >
        <Routes>
          <Route path="/enter" element={<Enter />} />
          <Route
            path="/menu"
            element={
              <QRAccessGuard>
                <Menu />
              </QRAccessGuard>
            }
          />
          <Route
            path="/cart"
            element={
              <QRAccessGuard>
                <CartPage />
              </QRAccessGuard>
            }
          />
          <Route
            path="/order"
            element={
              <QRAccessGuard>
                <Order />
              </QRAccessGuard>
            }
          />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/invalid-access" element={<InvalidAccess />} />
          <Route
            path="/"
            element={
              <div className="flex min-h-screen flex-col items-center justify-center p-4">
                <h1 className="mb-4 text-3xl font-bold">QR Onsite Ordering</h1>
                <p className="text-gray-500">
                  Scan a QR code at a venue to get started.
                </p>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
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
import Plans from "./pages/Plans";
import Admin from "./pages/Admin";
import AdminShops from "./pages/AdminShops";
import AdminPlans from "./pages/AdminPlans";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/enter" element={<Enter />} />
      <Route path="/invalid-access" element={<InvalidAccess />} />

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

      {/* Shop Dashboard */}
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/menu-manager" element={<MenuManager />} />
      <Route path="/qr-generator" element={<QrGenerator />} />
      <Route path="/plans" element={<Plans />} />

      {/* Admin */}
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin/shops" element={<AdminShops />} />
      <Route path="/admin/plans" element={<AdminPlans />} />
    </Routes>
  );
}
