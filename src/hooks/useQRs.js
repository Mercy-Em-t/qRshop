import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase-client';

export function useQRs(shopId) {
  const [qrs, setQrs] = useState(() => {
    try {
      if (!shopId) return [];
      const cached = localStorage.getItem(`qrs_cache_${shopId}`);
      return cached ? JSON.parse(cached) : [];
    } catch {
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
    if (shopId) fetchQRs();
  }, [shopId]);

  async function fetchQRs() {
    setLoading(true);
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('qrs')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setQrs(data);
        localStorage.setItem(`qrs_cache_${shopId}`, JSON.stringify(data));
      }
    } catch (err) {
      console.warn("Offline fetch fallback active:", err);
    }
    setLoading(false);
  }

  async function addQR(newQR) {
    if (!navigator.onLine) {
        alert("You must be online to create new nodes.");
        return { error: new Error("Offline") };
    }
    const { data, error } = await supabase
      .from('qrs')
      .insert(newQR)
      .select();
      
    if (!error && data) setQrs((prev) => [data[0], ...prev]);
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
      .eq('id', qrId)
      .select();
      
    if (!error && data) {
      setQrs((prev) => prev.map((q) => (q.id === qrId ? data[0] : q)));
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
      .eq('id', qrId);
      
    if (!error) {
      setQrs((prev) => prev.filter((q) => q.id !== qrId));
    }
    return { error };
  }

  return { qrs, loading, fetchQRs, addQR, updateQR, deleteQR };
}
