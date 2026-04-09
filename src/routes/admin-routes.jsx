/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react';
import { Route } from 'react-router-dom';
import LazyRoute from './LazyRoute';

const MasterAdmin = lazy(() => import('../pages/MasterAdmin'));
const Admin = lazy(() => import('../pages/Admin'));
const AdminShops = lazy(() => import('../pages/AdminShops'));
const AdminPlans = lazy(() => import('../pages/AdminPlans'));
const AdminSEO = lazy(() => import('../pages/AdminSEO'));
const AdminReport = lazy(() => import('../pages/AdminReport'));
const AdminEngineering = lazy(() => import('../pages/AdminEngineering'));
const AdminGlobalOrders = lazy(() => import('../pages/AdminGlobalOrders'));
const AdminGlobalProducts = lazy(() => import('../pages/AdminGlobalProducts'));
const AdminMonitoring = lazy(() => import('../pages/AdminMonitoring'));
const SupplierSignup = lazy(() => import('../pages/SupplierSignup'));
const AdminSuppliers = lazy(() => import('../pages/AdminSuppliers'));
const AdminAnalytics = lazy(() => import('../pages/AdminAnalytics'));
const AdminTodo = lazy(() => import('../pages/AdminTodo'));
const AdminBooklet = lazy(() => import('../pages/AdminBooklet'));
const AdminPayouts = lazy(() => import('../pages/AdminPayouts'));
const AdminIndustries = lazy(() => import('../pages/AdminIndustries'));
const AdminGateway = lazy(() => import('../pages/AdminGateway'));
const DeveloperPortal = lazy(() => import('../pages/DeveloperPortal'));
const WholesaleSalesSystem = lazy(() => import('../pages/WholesaleSalesSystem'));
const WholesaleJourneyMap = lazy(() => import('../pages/WholesaleJourneyMap'));
const SeedWholesaleUser = lazy(() => import('../pages/SeedWholesaleUser'));

export function renderAdminRoutes() {
  return (
    <>
      <Route path="/admin" element={<LazyRoute><MasterAdmin /></LazyRoute>} />
      <Route path="/admin/ops" element={<LazyRoute><Admin /></LazyRoute>} />
      <Route path="/admin/shops" element={<LazyRoute><AdminShops /></LazyRoute>} />
      <Route path="/admin/plans" element={<LazyRoute><AdminPlans /></LazyRoute>} />
      <Route path="/admin/seo" element={<LazyRoute><AdminSEO /></LazyRoute>} />
      <Route path="/admin/report" element={<LazyRoute><AdminReport /></LazyRoute>} />
      <Route path="/admin/engineering" element={<LazyRoute><AdminEngineering /></LazyRoute>} />
      <Route path="/admin/global-orders" element={<LazyRoute><AdminGlobalOrders /></LazyRoute>} />
      <Route path="/admin/global-products" element={<LazyRoute><AdminGlobalProducts /></LazyRoute>} />
      <Route path="/monitoring" element={<LazyRoute><AdminMonitoring /></LazyRoute>} />
      <Route path="/join/distribution-network" element={<LazyRoute><SupplierSignup /></LazyRoute>} />
      <Route path="/admin/suppliers" element={<LazyRoute><AdminSuppliers /></LazyRoute>} />
      <Route path="/admin/analytics" element={<LazyRoute><AdminAnalytics /></LazyRoute>} />
      <Route path="/admin/todo" element={<LazyRoute><AdminTodo /></LazyRoute>} />
      <Route path="/admin/booklet" element={<LazyRoute><AdminBooklet /></LazyRoute>} />
      <Route path="/admin/payouts" element={<LazyRoute><AdminPayouts /></LazyRoute>} />
      <Route path="/admin/industries" element={<LazyRoute><AdminIndustries /></LazyRoute>} />
      <Route path="/admin/gateway" element={<LazyRoute><AdminGateway /></LazyRoute>} />
      <Route path="/developer/portal" element={<LazyRoute><DeveloperPortal /></LazyRoute>} />
      <Route path="/developer/wholesale" element={<LazyRoute><WholesaleSalesSystem /></LazyRoute>} />
      <Route path="/developer/journey" element={<LazyRoute><WholesaleJourneyMap /></LazyRoute>} />
      <Route path="/developer/seed-wholesale" element={<LazyRoute><SeedWholesaleUser /></LazyRoute>} />
    </>
  );
}
