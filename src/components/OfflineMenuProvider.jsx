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
      // 1. Initial Load: Try to get from cache first to avoid flickering
      const cached = getCachedMenu(shopId);
      if (cached && Object.keys(cached).length > 0) {
        setCategories(cached);
        setLoading(false);
        setIsOffline(false); // Assume we'll try network
      } else {
        setLoading(true);
      }

      try {
        // 2. Fetch fresh data from network
        const data = await getMenuItemsByCategory(shopId);
        if (data && Object.keys(data).length > 0) {
          setCategories(data);
          cacheMenu(shopId, data);
          setIsOffline(false);
        } else if (!cached) {
          // If network empty AND no cache, we truly have nothing
          setCategories({});
        }
      } catch (err) {
        console.warn("OfflineMenuProvider: Network fetch failed, relying on cache.", err);
        // Network error — if we don't have cached data yet, try to get it now
        if (!cached) {
           const finalCached = getCachedMenu(shopId);
           if (finalCached) {
             setCategories(finalCached);
             setIsOffline(true);
           }
        } else {
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
