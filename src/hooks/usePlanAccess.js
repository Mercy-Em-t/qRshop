import { useState, useEffect } from "react";
import { getCurrentUser } from "../services/auth-service";
import { getSubscription } from "../services/subscription-service";

export default function usePlanAccess() {
  const [access, setAccess] = useState({
    isFree: true,
    isPro: false,
    isEnterprise: false,
    isSystemAdmin: false,
    loading: true
  });

  useEffect(() => {
    async function checkPlan() {
      const user = getCurrentUser();
      
      if (!user) {
        setAccess(prev => ({ ...prev, loading: false }));
        return;
      }

      // System Admins bypass all locks
      if (user.role === "system_admin") {
        setAccess({
          isFree: true,
          isPro: true,
          isEnterprise: true,
          isSystemAdmin: true,
          loading: false
        });
        return;
      }

      // If regular shop owner, check subscription tier
      try {
        const sub = await getSubscription(user.shop_id);
        const planId = sub?.plan?.toLowerCase() || 'free';
        
        setAccess({
          isFree: true, 
          isPro: planId === 'pro' || planId === 'enterprise',
          isEnterprise: planId === 'enterprise',
          isSystemAdmin: false,
          loading: false
        });
      } catch (err) {
        console.warn("Failed to verify plan access, defaulting to free", err);
        setAccess(prev => ({ ...prev, loading: false }));
      }
    }

    checkPlan();
  }, []);

  return access;
}
