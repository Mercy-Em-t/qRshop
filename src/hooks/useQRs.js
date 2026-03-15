import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase-client';

export function useQRs(shopId) {
  const [qrs, setQrs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shopId) fetchQRs();
  }, [shopId]);

  async function fetchQRs() {
    setLoading(true);
    if (!supabase) {
      setQrs([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('qrs')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });
      
    if (!error) setQrs(data || []);
    setLoading(false);
  }

  async function addQR(newQR) {
    const { data, error } = await supabase
      .from('qrs')
      .insert(newQR)
      .select();
      
    if (!error && data) setQrs((prev) => [data[0], ...prev]);
    return { data, error };
  }

  async function updateQR(qrId, updates) {
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
