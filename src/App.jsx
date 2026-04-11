import { useEffect, useState, useMemo } from "react";
import { getShopBySubdomain } from "./services/shop-service";
import { Routes, Route } from "react-router-dom";
import PublicShopProfile from "./pages/PublicShopProfile";
import { renderPublicRoutes } from "./routes/public-routes";
import { renderCustomerRoutes } from "./routes/customer-routes";
import { renderDashboardRoutes } from "./routes/dashboard-routes";
import { renderAdminRoutes } from "./routes/admin-routes";
import { useOfflineEventQueue } from "./hooks/useOfflineEventQueue";
import { useSessionInactivity } from "./hooks/useSessionInactivity";

export default function App() {
  const [subdomainShopId, setSubdomainShopId] = useState(null);
  const [resolving, setResolving] = useState(true);

  // useOfflineEventQueue(); 
  useSessionInactivity(15); // Explicit 15-minute inactivity logout

  useEffect(() => {
    document.title = "ShopQR | Instant WhatsApp Menus & Ordering";

    async function resolveSubdomain() {
      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      
      // Logic: If on a subdomain (e.g., shop123.shopqr.com or shop123.localhost)
      // but NOT the main domain (e.g. tmsavannah.com)
      const isLocal = hostname === 'localhost' || hostname.includes('127.0.0.1');
      const isVercel = hostname.includes('vercel.app');
      const isCustomDomain = hostname.includes('tmsavannah.com');
      
      let subdomain = null;
      if (isCustomDomain || isVercel) {
         // shop.tmsavannah.com (parts.length >= 3) or shop.qrshop.vercel.app (parts.length >= 4)
         if (isVercel && parts.length >= 4) {
            subdomain = parts[0];
         } else if (isCustomDomain && parts.length >= 3) {
            subdomain = parts[0];
         }
      } else if (isLocal && parts.length >= 2) {
         subdomain = parts[0];
      }

      if (subdomain && subdomain !== 'www') {
         // Security Layer: Resolution Cache (sessionStorage)
         const cachedId = sessionStorage.getItem(`subdomain_cache_${subdomain}`);
         if (cachedId) {
            setSubdomainShopId(cachedId);
            setResolving(false);
            return;
         }

         try {
            const shop = await getShopBySubdomain(subdomain);
            if (shop) {
               // Strict Security Validation: Ensure shop.id is a valid UUID v4
               const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
               if (uuidRegex.test(shop.id)) {
                  setSubdomainShopId(shop.id);
                  sessionStorage.setItem(`subdomain_cache_${subdomain}`, shop.id);
               } else {
                  console.error("Security Incident: Malformed Shop ID received from resolution.");
               }
            } else {
               // UNKNOWN SUBDOMAIN: Ensure the resolver falls back to the main homepage
               // by leaving subdomainShopId as null.
               console.warn(`Routing Notice: Subdomain "${subdomain}" not recognized. Redirecting internal resolution to main platform Home.`);
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

  const publicRoutes = useMemo(() => renderPublicRoutes(), []);
  const customerRoutes = useMemo(() => renderCustomerRoutes(), []);
  const dashboardRoutes = useMemo(() => renderDashboardRoutes(), []);
  const adminRoutes = useMemo(() => renderAdminRoutes(), []);

  return (
    <Routes>
      {publicRoutes}
      {customerRoutes}
      {dashboardRoutes}
      {adminRoutes}

      {/* Fallback 404 to explicitly prevent blank white screens on invalid paths */}
      <Route path="*" element={
         <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-4">
            <h1 className="text-4xl mb-4">🧭</h1>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h2>
            <p className="text-gray-500 mb-6">The link you followed may be broken or the page may have been removed.</p>
            <a href="/" className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition">Return Home</a>
         </div>
      } />
    </Routes>
  );
}
