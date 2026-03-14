import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createQrSession } from "../utils/qr-session";
import { getShop } from "../services/shop-service";
import { validateQrSession, getDeviceId } from "../services/qr-session-service";
import { checkLocation } from "../utils/location-check";

export default function Enter() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationWarning, setLocationWarning] = useState(null);

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

        // Server-side QR session validation
        const deviceId = getDeviceId();
        const serverSession = await validateQrSession(shopId, table, deviceId);
        if (!serverSession) {
          setError("Failed to create session. Please try again.");
          setLoading(false);
          return;
        }

        // Optional location check if shop has coordinates
        if (shop.latitude && shop.longitude) {
          try {
            const locationResult = await checkLocation(shop.latitude, shop.longitude);
            if (!locationResult.withinRange) {
              setLocationWarning(
                `You appear to be ${Math.round(locationResult.distance)}m from the venue. Access is allowed, but please ensure you are at the correct location.`
              );
            }
          } catch {
            // Location check failed (denied/unsupported) — allow access anyway
          }
        }

        createQrSession(shopId, table, serverSession);
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
          <p className="text-gray-600">Validating your QR code...</p>
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

  if (locationWarning) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full text-center">
          <div className="text-yellow-500 text-4xl mb-4">📍</div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">
            Location Notice
          </h1>
          <p className="text-gray-500 mb-4">{locationWarning}</p>
          <button
            onClick={() => navigate("/menu", { replace: true })}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors cursor-pointer"
          >
            Continue to Menu
          </button>
        </div>
      </div>
    );
  }

  return null;
}
