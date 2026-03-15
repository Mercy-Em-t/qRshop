import { useState, useEffect } from 'react'
import { fetchShop } from '../services/shop-service'

export function useShop(shopId) {
  const [shop, setShop] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!shopId) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const data = await fetchShop(shopId)
        if (!cancelled) setShop(data)
      } catch (err) {
        if (!cancelled) setError(err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [shopId])

  return { shop, loading, error }
import { useState, useEffect } from "react";
import { getShop } from "../services/shop-service";

export function useShop(shopId) {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!shopId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchShop() {
      setLoading(true);
      setError(null);

      try {
        const data = await getShop(shopId);
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
  }, [shopId]);

  return { shop, loading, error };
}
