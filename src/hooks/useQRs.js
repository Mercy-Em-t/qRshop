import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase-client';

export function useQRs(shopId) {
  const [qrs, setQrs] = useState(() => {
    try {
      if (!shopId) return [];
      const cacheKey = `qrs_cache_${shopId}`;
      const cacheVersion = "v3.1"; // Increment this to force refresh
      const versionKey = `${cacheKey}_version`;
      
      if (localStorage.getItem(versionKey) !== cacheVersion) {
        localStorage.removeItem(cacheKey);
        localStorage.setItem(versionKey, cacheVersion);
        return [];
      }

      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);

  // Sync state to local storage whenever it changes
  useEffect(() => {
    if (shopId && qrs.length > 0) {
      localStorage.setItem(`qrs_cache_${shopId}`, JSON.stringify(qrs));
    }
  }, [qrs, shopId]);

  useEffect(() => {
    if (shopId) {
       fetchQRs();
    } else {
       setLoading(false);
    }
  }, [shopId]);

  async function fetchQRs() {
    if (!supabase || !shopId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let isResolved = false;

    try {
      // Setup a timeout to forcefully kill the spinner after 6 seconds if network hangs
      const timeoutId = setTimeout(() => {
         if (!isResolved) {
             setLoading(false);
             console.warn("QR Sync timeout reached.");
         }
      }, 6000);

      const { data, error } = await supabase
        .from('qrs')
        .select('*, id:qr_id')
        .eq('shop_id', shopId)
        .not('location', 'ilike', 'AD:%')
        .order('created_at', { ascending: false });
        
      isResolved = true;
      clearTimeout(timeoutId);

      if (!error && data) {
        const normalized = data.map(q => ({
          ...q,
          qr_id: q.qr_id || q.id,
          id: q.id || q.qr_id,
          action: q.action || q.action_type || 'open_menu',
          location: q.location || 'Unknown Location'
        }));
        setQrs(normalized);
        localStorage.setItem(`qrs_cache_${shopId}`, JSON.stringify(normalized));
      } else if (error) {
        console.error("Failed to sync nodes from Supabase:", error);
      }
    } catch (err) {
      console.warn("Offline fetch fallback active:", err);
    } finally {
      isResolved = true;
      setLoading(false);
    }
  }

  async function addQR(newQR) {
    if (!navigator.onLine) {
        alert("You must be online to create new nodes.");
        return { error: new Error("Offline") };
    }
    const { data, error } = await supabase
      .from('qrs')
      .insert({ ...newQR, qr_id: newQR.qr_id || Math.random().toString(36).substring(2, 8).toUpperCase() })
      .select('*, id:qr_id');
      
    if (!error && data) {
      const normalized = {
        ...data[0],
        qr_id: data[0].qr_id || data[0].id,
        id: data[0].id || data[0].qr_id,
        action: data[0].action || data[0].action_type || 'open_menu',
        location: data[0].location || 'Unknown Location'
      };
      setQrs((prev) => [normalized, ...prev]);
    }
    return { data, error };
  }

  async function updateQR(qrId, updates) {
    if (!navigator.onLine) {
        alert("You must be online to reprogram nodes.");
        return { error: new Error("Offline") };
    }
    const { data, error } = await supabase
      .from('qrs')
      .update(updates)
      .eq('qr_id', qrId)
      .select('*, id:qr_id');
      
    if (!error && data) {
      const normalized = {
        ...data[0],
        qr_id: data[0].qr_id || data[0].id,
        id: data[0].id || data[0].qr_id,
        action: data[0].action || data[0].action_type || 'open_menu',
        location: data[0].location || 'Unknown Location'
      };
      setQrs((prev) => prev.map((q) => (q.qr_id === qrId ? normalized : q)));
    }
    return { data, error };
  }

  async function deleteQR(qrId) {
    if (!navigator.onLine) {
        alert("You must be online to delete nodes.");
        return { error: new Error("Offline") };
    }
    const { error } = await supabase
      .from('qrs')
      .delete()
      .eq('qr_id', qrId);
      
    if (!error) {
      setQrs((prev) => prev.filter((q) => q.qr_id !== qrId));
    }
    return { error };
  }

  return { qrs, loading, fetchQRs, addQR, updateQR, deleteQR };
}
