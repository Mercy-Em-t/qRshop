import { useState, useEffect } from "react";
import { getQrSession } from "../utils/qr-session";
import { Navigate } from "react-router-dom";
import { hasActivePaidPlan } from "../services/subscription-service";

export default function QrAccessGuard({ children }) {
  const session = getQrSession();
  const [isAllowed, setIsAllowed] = useState(null);
  
  // Checking session storage specifically, as this clears on browser tab close.
  // This physically prevents bookmarking or opening /menu directly later.
  const [scannedTime] = useState(sessionStorage.getItem("scanned_qr_true_timestamp"));

  useEffect(() => {
    async function checkAccess() {
      if (!session) {
         setIsAllowed(false);
         return;
      }
      
      // If we already have the scan stamp in this exact browser tab session, allow.
      if (scannedTime) {
         setIsAllowed(true);
         return;
      }

      // If no scan stamp (e.g. they typed /menu, bookmarked it, or opened a new tab),
      // Check if the shop allows remote access (Paid Tier).
      try {
         const isPaid = await hasActivePaidPlan(session.shop_id);
         setIsAllowed(isPaid); 
      } catch (err) {
         setIsAllowed(false);
      }
    }
    
    checkAccess();
  }, [session, scannedTime]);

  if (!session) {
    return <Navigate to="/invalid-access" replace />;
  }

  if (isAllowed === null) {
      return (
         <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
             <div className="animate-pulse flex flex-col items-center">
                 <div className="w-12 h-12 bg-gray-200 rounded-full mb-4"></div>
                 <div className="h-4 w-32 bg-gray-200 rounded"></div>
             </div>
         </div>
      );
  }

  if (isAllowed === false) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
           <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
           </div>
           <h1 className="text-2xl font-black text-gray-900 mb-2">QR Scan Required</h1>
           <p className="text-gray-500 mb-8 max-w-sm text-balance">
              This system operates on the Free Basic Tier and requires you to physically scan the QR code located at the table or station to place an order.
           </p>
        </div>
     );
  }

  return children;
}
