import { useState, useEffect } from "react";
import { getMenuItemsByCategory } from "../services/menu-service";
import { getCachedMenu, cacheMenu } from "../utils/menu-cache";
import { OfflineMenuContext } from "../contexts/offline-menu-context";

/**
 * Provider that caches menu data for offline access.
 * Tries to fetch from network first; falls back to cached data.
 */
export default function OfflineMenuProvider({ shopId, children }) {
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (!shopId) {
      setLoading(false);
      return;
    }

    async function fetchMenu() {
      setLoading(true);

      try {
        const data = await getMenuItemsByCategory(shopId);
        if (data && Object.keys(data).length > 0) {
          setCategories(data);
          cacheMenu(shopId, data);
          setIsOffline(false);
        } else {
          // Network returned empty — try cache
          const cached = getCachedMenu(shopId);
          if (cached) {
            setCategories(cached);
            setIsOffline(true);
          }
        }
      } catch {
        // Network error — try cache
        const cached = getCachedMenu(shopId);
        if (cached) {
          setCategories(cached);
          setIsOffline(true);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchMenu();
  }, [shopId]);

  return (
    <OfflineMenuContext.Provider value={{ categories, loading, isOffline }}>
      {children}
    </OfflineMenuContext.Provider>
  );
}
