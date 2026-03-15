const CACHE_PREFIX = "qr_menu_cache_";
const CACHE_EXPIRY_HOURS = 1;

/**
 * Cache menu data for a shop in localStorage.
 */
export function cacheMenu(shopId, menuData) {
  const entry = {
    data: menuData,
    cached_at: new Date().toISOString(),
  };
  try {
    localStorage.setItem(CACHE_PREFIX + shopId, JSON.stringify(entry));
  } catch (e) {
    console.warn("Failed to cache menu:", e);
  }
}

/**
 * Retrieve cached menu data for a shop.
 * Returns null if cache is expired or missing.
 */
export function getCachedMenu(shopId) {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + shopId);
    if (!raw) return null;

    const entry = JSON.parse(raw);
    if (isCacheExpired(entry.cached_at)) {
      clearMenuCache(shopId);
      return null;
    }

    return entry.data;
  } catch {
    clearMenuCache(shopId);
    return null;
  }
}

/**
 * Clear cached menu for a shop.
 */
export function clearMenuCache(shopId) {
  localStorage.removeItem(CACHE_PREFIX + shopId);
}

/**
 * Check if cache timestamp is expired.
 */
function isCacheExpired(cachedAt) {
  if (!cachedAt) return true;
  const cached = new Date(cachedAt);
  const now = new Date();
  const diffHours = (now - cached) / (1000 * 60 * 60);
  return diffHours > CACHE_EXPIRY_HOURS;
}
