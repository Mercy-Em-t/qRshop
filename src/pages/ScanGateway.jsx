import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getQrNode } from "../services/qr-node-service";
import { logEvent } from "../services/telemetry-service";
import { logVisit } from "../services/visit-service";
import { createQrSession } from "../utils/qr-session";
import BrandedSplash from "../components/BrandedSplash";

export default function ScanGateway() {
  const { qrId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    async function processScan() {
      try {
        if (!qrId) throw new Error("Invalid QR Code");

        // 1. Fetch QR Node Data
        const node = await getQrNode(qrId);

        if (!node) {
          navigate("/invalid-access", { replace: true });
          return;
        }

        if (node.status !== "active") {
          setError("This QR code is currently inactive.");
          return;
        }

        // 2. Log Visit Record
        const visit = await logVisit(qrId, node.shop_id).catch((err) => {
          console.error("Visit logging failed:", err);
          return null;
        });

        // 3. Log Telemetry Event (Fire and Forget)
        logEvent("qr_scanned", qrId, node.shop_id, navigator.userAgent, {
          visit_id: visit?.visit_id || null,
        }).catch((err) => console.error("Telemetry failed:", err));

        // 4. Resolve Behavior based on Standardized Actions
        switch (node.action) {
          case 'open_menu':
            // Setup global session tied to this deployment zone
            createQrSession(node.shop_id, node.location);
            navigate("/menu", { replace: true });
            break;
            
          case 'open_order':
            createQrSession(node.shop_id, node.location);
            navigate("/cart", { replace: true });
            break;
            
          case 'open_campaign':
             // Programmatic change executed from Code Manager Dashboard
             createQrSession(node.shop_id, node.location);
             navigate("/campaign", { replace: true });
             break;
             
          case 'open_loyalty':
             setError(`The Loyalty experience is currently under construction.`);
             break;
             
          default:
             setError(`Action '${node.action}' is not supported by this platform version.`);
        }
      } catch (err) {
        console.error("Gateway error:", err);
        navigate("/invalid-access", { replace: true });
      }
    }

    processScan();
  }, [qrId, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <h1 className="mb-4 text-2xl font-bold text-red-600">Action Unavailable</h1>
        <p className="mb-6 text-gray-500 text-center">{error}</p>
      </div>
    );
  }

  return <BrandedSplash />;
}
