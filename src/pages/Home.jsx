import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PublicShopProfile from "./PublicShopProfile";
import { getShopBySubdomain } from "../services/shop-service";

// Define domains that should NEVER be treated as tenant subdomains
const RESERVED_DOMAINS = ["localhost", "127.0.0.1", "www", "tmsavannah.com", "tmsavannah", "shopqrplatform", "shopqr"];

export default function Home() {
  const [subdomainShopId, setSubdomainShopId] = useState(null);
  const [isVerifyingSubdomain, setIsVerifyingSubdomain] = useState(true);

  useEffect(() => {
    // Intercept wildcard subdomains natively on the client
    const hostname = window.location.hostname;
    const parts = hostname.split(".");
    
    // e.g. "shop1.tmsavannah.com" -> parts[0] is "shop1".
    // "localhost" -> parts[0] is "localhost"
    const parsedSubdomain = parts[0];

    // If it's a reserved core domain or standard IP, skip and show the regular Homepage
    const isReserved = RESERVED_DOMAINS.some(domain => hostname.includes(domain) && parts.length <= 2) || RESERVED_DOMAINS.includes(parsedSubdomain);

    if (isReserved) {
      setIsVerifyingSubdomain(false);
      return;
    }

    // We have what appears to be a legitimate tenant subdomain. Let's ask the database.
    async function checkSubdomain() {
       const shop = await getShopBySubdomain(parsedSubdomain);
       if (shop) {
          setSubdomainShopId(shop.id);
       }
       setIsVerifyingSubdomain(false);
    }
    
    checkSubdomain();
  }, []);

  // Show a blank/loading screen while we ask Supabase if this subdomain is real
  if (isVerifyingSubdomain) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
    </div>;
  }

  // If a shop was successfully found for this subdomain, hijack the Root Route and show the Shop!
  if (subdomainShopId) {
     return <PublicShopProfile directShopId={subdomainShopId} />;
  }

  // Otherwise, if no subdomain (or an invalid one) was found, show the standard Landing Page
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">qRshop</h1>
        <p className="text-gray-500 mb-8">
          QR-based ordering for restaurants, cafés, and kiosks.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            to="/login"
            className="bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Shop Owner Login
          </Link>
          <Link
            to="/admin"
            className="bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition-colors"
          >
            Admin Panel
          </Link>
        </div>

        <p className="text-sm text-gray-400 mt-8">
          Customers: scan the QR code at your table to order.
        </p>
      </div>
    </div>
  );
}
