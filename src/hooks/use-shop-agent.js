import { useEffect, useRef } from 'react';
import { ShopAgent } from '../services/ShopAgent.js';

/**
 * Hook to manage the ShopAgent lifecycle within the dashboard.
 */
export function useShopAgent(shopId) {
  const agentRef = useRef(null);

  useEffect(() => {
    if (!shopId) return;

    if (!agentRef.current) {
      agentRef.current = new ShopAgent(shopId);
      agentRef.current.activate();
    }

    return () => {
      // Cleanup logic if needed (e.g. unsubscribe)
    };
  }, [shopId]);

  return agentRef.current;
}
