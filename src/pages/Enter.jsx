import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createQrSession } from "../utils/qr-session";
import { getShop } from "../services/shop-service";

export default function Enter() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function validateAndRedirect() {
      const shopId = searchParams.get("shop");
      const table = searchParams.get("table");

      if (!shopId || !table) {
        setError("Invalid QR code. Missing shop or table information.");
        setLoading(false);
        return;
      }

      try {
        const shop = await getShop(shopId);
        if (!shop) {
          setError("Shop not found. Please scan a valid QR code.");
          setLoading(false);
          return;
        }

        createQrSession(shopId, table);
        navigate("/menu", { replace: true });
      } catch {
        setError("Something went wrong. Please try again.");
        setLoading(false);
      }
    }

    validateAndRedirect();
  }, [searchParams, navigate]);

  if (loading && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">
            Invalid QR Code
          </h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return null;
}
