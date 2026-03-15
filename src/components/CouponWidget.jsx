import { useState, useEffect } from "react";
import { useCart } from "../hooks/use-cart";
import { logEvent } from "../services/telemetry-service";
import { getQrSession } from "../utils/qr-session";

export default function CouponWidget() {
  const { activeCoupon, applyCoupon } = useCart();
  const [isVisible, setIsVisible] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const session = getQrSession();

  // Show the widget gracefully 1.5 seconds after loading the menu
  useEffect(() => {
    if (activeCoupon) return; // Don't show if they already have one active
    
    const timer = setTimeout(() => {
      // Check local storage so we don't spam returning users in the same session
      const hasSeen = sessionStorage.getItem("has_seen_promo");
      if (!hasSeen) {
        setIsVisible(true);
      }
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [activeCoupon]);

  const handleClaim = () => {
    const promo = {
      code: "WELCOME20",
      description: "Smart Scan Promo",
      discountPercentage: 20
    };
    
    applyCoupon(promo);
    setIsClaimed(true);
    sessionStorage.setItem("has_seen_promo", "true");
    
    // Telemetry - We log that the incentive worked!
    if (session) {
      logEvent("reward_claimed", "N/A", session.shop_id, navigator.userAgent, {
        promo_code: promo.code,
        discount: promo.discountPercentage
      });
    }

    // Hide the widget completely after the success animation
    setTimeout(() => {
      setIsVisible(false);
    }, 2000);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("has_seen_promo", "true");
  };

  if (!isVisible && !isClaimed) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 p-4 transition-transform duration-500 ease-in-out ${isVisible || isClaimed ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="max-w-lg mx-auto w-full">
        <div className={`relative overflow-hidden rounded-2xl shadow-2xl border-t-4 ${isClaimed ? 'bg-green-600 border-green-400' : 'bg-gradient-to-r from-purple-600 to-indigo-600 border-yellow-400'} p-5 transition-all duration-500`}>
          
          {/* Close button */}
          {!isClaimed && (
             <button onClick={handleDismiss} className="absolute top-2 right-3 text-white/60 hover:text-white pb-2 pl-2 cursor-pointer">
               ✕
             </button>
          )}

          {isClaimed ? (
            <div className="text-center animate-fade-in py-2">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
                <svg className="w-6 h-6 text-green-600 animate-[bounce_1s_infinite]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h3 className="text-white font-bold text-lg tracking-tight">20% Discount Activated!</h3>
              <p className="text-green-100 text-sm mt-1">Discount will be applied at checkout.</p>
            </div>
          ) : (
            <div className="flex gap-4 items-center animate-fade-in-up">
              <div className="hidden sm:flex w-14 h-14 bg-yellow-400 rounded-full items-center justify-center shadow-lg transform -rotate-12 flex-shrink-0">
                 <span className="text-xl font-black text-purple-900">%</span>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg leading-tight mb-1">Secret Scan Reward! 🎁</h3>
                <p className="text-purple-100 text-sm leading-snug pr-4">Claim 20% off your entire order just for browsing the digital menu.</p>
              </div>
              <button 
                onClick={handleClaim}
                className="bg-yellow-400 hover:bg-yellow-300 text-purple-900 font-bold py-3 px-5 rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 whitespace-nowrap cursor-pointer"
              >
                Claim Now
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
