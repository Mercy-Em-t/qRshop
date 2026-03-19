import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getQrNode } from "../services/qr-node-service";
import { logEvent } from "../services/telemetry-service";
import { logVisit } from "../services/visit-service";
import { createQrSession } from "../utils/qr-session";
import BrandedSplash from "../components/BrandedSplash";

export default function ScanGateway() {
  const { qrId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  
  // Privacy Consent State
  const [needsConsent, setNeedsConsent] = useState(false);
  const [pendingNode, setPendingNode] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function initScan() {
      try {
        if (!qrId) throw new Error("Invalid QR Code");

        const node = await getQrNode(qrId);

        if (!node) {
          navigate("/invalid-access", { replace: true });
          return;
        }

        if (node.status !== "active") {
          setError("This QR code is currently inactive.");
          return;
        }

        // Check for Privacy Consent
        const hasConsented = localStorage.getItem("shopqr_privacy_consent");
        if (hasConsented !== "true") {
           setPendingNode(node);
           setNeedsConsent(true);
           return;
        }

        // Already consented -> Proceed
        await processAction(node);
      } catch (err) {
        console.error("Gateway error:", err);
        navigate("/invalid-access", { replace: true });
      }
    }

    if (!isProcessing) {
      initScan();
    }
  }, [qrId, navigate]);

  const processAction = async (node) => {
     setIsProcessing(true);
     
     // 1. Log Visit Record
     const visit = await logVisit(qrId, node.shop_id).catch((err) => {
        console.error("Visit logging failed:", err);
        return null;
     });

     // 2. Log Telemetry Event (Fire and Forget)
     logEvent("qr_scanned", qrId, node.shop_id, navigator.userAgent, {
        visit_id: visit?.visit_id || null,
        campaign_id: node.campaign_id || null,
     }).catch((err) => console.error("Telemetry failed:", err));

     // 3. Dynamic QR — Time-Based Routing (Phase 46)
     if (node.opens_at || node.closes_at) {
       const now = new Date();
       const toMinutes = (t) => {
         if (!t) return null;
         const [h, m] = t.split(":").map(Number);
         return h * 60 + m;
       };
       const currentMinutes = now.getHours() * 60 + now.getMinutes();
       const opensAtMinutes = toMinutes(node.opens_at);
       const closesAtMinutes = toMinutes(node.closes_at);

       const isOpen = (
         (opensAtMinutes !== null && closesAtMinutes !== null)
           ? currentMinutes >= opensAtMinutes && currentMinutes < closesAtMinutes
           : true
       );

       if (!isOpen) {
         const msg = node.closed_message || "We are currently closed. Please come back during our business hours!";
         const opens = node.opens_at ? node.opens_at.slice(0,5) : null;
         const closes = node.closes_at ? node.closes_at.slice(0,5) : null;
         setError(`${msg}${opens && closes ? ` (We're open ${opens} – ${closes})` : ""}`);
         return;
       }
     }

     // 4. Resolve Behavior based on Standardized Actions
     const categoryParam = node.category_filter ? `?category=${encodeURIComponent(node.category_filter)}` : "";

     switch (node.action) {
        case 'open_menu':
          createQrSession(node.shop_id, node.location);
          navigate(`/menu${categoryParam}`, { replace: true });
          break;
          
        case 'open_order':
          createQrSession(node.shop_id, node.location);
          if (node.location && node.location.length === 36 && node.location.includes('-')) {
             // It's a semantic Product link! Forward immediately to AutoCart.
             navigate(`/buy?shop=${node.shop_id}&items=${node.location}:1`, { replace: true });
          } else {
             // Standard shop table checkout
             navigate("/cart", { replace: true });
          }
          break;
          
        case 'open_campaign':
           createQrSession(node.shop_id, node.location, null, node.campaign_id);
           navigate("/campaign", { replace: true, state: { campaignId: node.campaign_id } });
           break;
           
        case 'open_loyalty':
           setError(`The Loyalty experience is currently under construction.`);
           break;
           
        default:
           setError(`Action '${node.action}' is not supported by this platform version.`);
     }
  };

  const handleConsentAccept = () => {
      localStorage.setItem("shopqr_privacy_consent", "true");
      setNeedsConsent(false);
      if (pendingNode) {
         processAction(pendingNode);
      }
  };

  const handleConsentDecline = () => {
      setError("You must accept the privacy policy to interact with this smart location.");
      setNeedsConsent(false);
  };

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
        <h1 className="mb-4 text-2xl font-bold text-red-600">Action Unavailable</h1>
        <p className="mb-6 text-gray-500 text-center">{error}</p>
        <button onClick={() => navigate('/')} className="px-6 py-2 bg-gray-900 text-white rounded-xl font-medium">Home</button>
      </div>
    );
  }

  if (needsConsent) {
     return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
           <div className="bg-white max-w-sm w-full rounded-3xl shadow-2xl p-8 text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              </div>
              <h2 className="text-xl font-extrabold text-gray-800 mb-2">Privacy & Tracking</h2>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                 To provide you with a seamless ordering experience, this QR code will track your session and may link to WhatsApp if you choose to checkout. By continuing, you consent to data collection in accordance with our Privacy Policy & the Kenya Data Protection Act.
              </p>
              
              <div className="flex flex-col gap-3">
                 <button onClick={handleConsentAccept} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition">
                    I Agree, Continue
                 </button>
                 <button onClick={handleConsentDecline} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 px-4 rounded-xl transition">
                    Decline & Exit
                 </button>
              </div>
           </div>
        </div>
     );
  }

  return <BrandedSplash />;
}
