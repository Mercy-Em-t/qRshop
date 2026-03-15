import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getQrNode } from "../services/qr-node-service";
import { logEvent } from "../services/telemetry-service";
import { createQrSession } from "../utils/qr-session";
import LoadingSpinner from "../components/LoadingSpinner";

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

        // 2. Log Telemetry Event (Fire and Forget)
        logEvent("qr_scanned", qrId, node.shop_id, navigator.userAgent).catch(
          (err) => console.error("Telemetry failed:", err)
        );

        // 3. Resolve Behavior 
        if (node.action === "open_menu") {
          // Fallback legacy table assignment based on location if needed,
          // though usually location is more descriptive than a simple table number
          const safeTableNumber = node.location || "Unknown";
          
          createQrSession(node.shop_id, safeTableNumber);
          navigate("/menu", { replace: true });
        } else {
          // Future actions could be opening a specific product, a promotion, etc.
          setError(`Action '${node.action}' is not yet supported by this client.`);
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

  return <LoadingSpinner message="Resolving QR Gateway..." />;
}
