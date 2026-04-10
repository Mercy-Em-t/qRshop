/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import OnboardingGate from '../components/OnboardingGate';
import LazyRoute from './LazyRoute';

const Login = lazy(() => import('../pages/Login'));
const Signup = lazy(() => import('../pages/Signup'));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/ResetPassword'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const OrderManager = lazy(() => import('../pages/OrderManager'));
const QrDashboard = lazy(() => import('../pages/QrDashboard'));
const QRAnalytics = lazy(() => import('../pages/dashboard/qr-detail'));
const DynamicQrSettings = lazy(() => import('../pages/dashboard/DynamicQrSettings'));
const CampaignManager = lazy(() => import('../pages/CampaignManager'));
const MarketingStudio = lazy(() => import('../pages/MarketingStudio'));
const SupplierPortal = lazy(() => import('../pages/SupplierPortal'));
const SupplierDirectory = lazy(() => import('../pages/SupplierDirectory'));
const ShopFinances = lazy(() => import('../pages/ShopFinances'));
const Settings = lazy(() => import('../pages/Settings'));
const DeliveryPortal = lazy(() => import('../pages/DeliveryPortal'));
const DeliveryWorker = lazy(() => import('../pages/DeliveryWorker'));
const DeliveryDashboard = lazy(() => import('../pages/DeliveryDashboard'));
const MenuManager = lazy(() => import('../pages/MenuManager'));
const QrGenerator = lazy(() => import('../pages/QrGenerator'));
const Plans = lazy(() => import('../pages/Plans'));

function DashboardRoutesContent() {
  return (
    <Routes>
      <Route path="/" element={<LazyRoute><Dashboard /></LazyRoute>} />
      <Route path="analytics" element={<Navigate to="/dashboard#analytics" replace />} />
      <Route path="orders" element={<LazyRoute><OrderManager /></LazyRoute>} />
      <Route path="qrs" element={<LazyRoute><QrDashboard /></LazyRoute>} />
      <Route path="qrs/:qrId" element={<LazyRoute><QRAnalytics /></LazyRoute>} />
      <Route path="qrs/:qrId/settings" element={<LazyRoute><DynamicQrSettings /></LazyRoute>} />
      <Route path="campaigns" element={<LazyRoute><CampaignManager /></LazyRoute>} />
      <Route path="marketing" element={<LazyRoute><MarketingStudio /></LazyRoute>} />
      <Route path="supply-mgmt" element={<LazyRoute><SupplierPortal /></LazyRoute>} />
      <Route path="connect-distribution" element={<LazyRoute><SupplierDirectory /></LazyRoute>} />
      <Route path="finances" element={<LazyRoute><ShopFinances /></LazyRoute>} />
      <Route path="settings" element={<LazyRoute><Settings /></LazyRoute>} />
      <Route path="delivery" element={<LazyRoute><DeliveryPortal /></LazyRoute>} />
      <Route path="delivery/worker" element={<LazyRoute><DeliveryWorker /></LazyRoute>} />
      <Route path="delivery/manager" element={<LazyRoute><DeliveryDashboard /></LazyRoute>} />
    </Routes>
  );
}

export function renderDashboardRoutes() {
  return (
    <>
      <Route path="/login" element={<LazyRoute><Login /></LazyRoute>} />
      <Route path="/signup" element={<LazyRoute><Signup /></LazyRoute>} />
      <Route path="/forgot-password" element={<LazyRoute><ForgotPassword /></LazyRoute>} />
      <Route path="/reset-password" element={<LazyRoute><ResetPassword /></LazyRoute>} />
      <Route
        path="/dashboard/*"
        element={
          <OnboardingGate>
            <DashboardRoutesContent />
          </OnboardingGate>
        }
      />
      <Route path="/menu-manager" element={<OnboardingGate><LazyRoute><MenuManager /></LazyRoute></OnboardingGate>} />
      <Route path="/qr-generator" element={<OnboardingGate><LazyRoute><QrGenerator /></LazyRoute></OnboardingGate>} />
      <Route path="/plans" element={<OnboardingGate><LazyRoute><Plans /></LazyRoute></OnboardingGate>} />
    </>
  );
}
