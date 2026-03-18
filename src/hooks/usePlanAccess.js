import { useState, useEffect } from "react";
import { getCurrentUser } from "../services/auth-service";
import { getSubscription } from "../services/subscription-service";

export default function usePlanAccess() {
  const [access, setAccess] = useState({
    isFree: true,
    isBasic: false,
    isPro: false,
    isBusiness: false,
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
          isBasic: true,
          isPro: true,
          isBusiness: true,
          isEnterprise: true,
          isSystemAdmin: true,
          loading: false
        });
        return;
      }

      // If regular shop owner, check subscription tier
      try {
        const sub = await getSubscription(user.shop_id);
        // First check the subscriptions table, then fall back to shops.plan column
        // (AdminShops directly updates shops.plan so we must read both sources)
        let planId = sub?.plan?.toLowerCase() || null;
        
        if (!planId) {
          // Fall back to reading the shop's plan column directly
          const { supabase } = await import('./supabase-client');
          const { data: shopData } = await supabase
            .from('shops')
            .select('plan')
            .eq('id', user.shop_id)
            .single();
          planId = shopData?.plan?.toLowerCase() || 'free';
        }
        
        setAccess({
          isFree: true, // Everyone gets free baseline
          isBasic: ['basic', 'pro', 'business', 'enterprise'].includes(planId),
          isPro: ['pro', 'business', 'enterprise'].includes(planId),
          isBusiness: ['business', 'enterprise'].includes(planId),
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
