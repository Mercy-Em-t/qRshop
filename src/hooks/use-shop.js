import { useState, useEffect } from "react";
import { resolveShopIdentifier } from "../services/shop-service";

export function useShop(identifier) {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!identifier) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchShop() {
      setLoading(true);
      setError(null);

      try {
        const data = await resolveShopIdentifier(identifier);
        if (!cancelled) {
          setShop(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchShop();

    return () => {
      cancelled = true;
    };
  }, [identifier]);

  return { shop, loading, error };
}
