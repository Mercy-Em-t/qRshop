import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase-client';

export function useCampaigns(shopId) {
  const [campaigns, setCampaigns] = useState(() => {
    try {
      if (!shopId) return [];
      const cached = localStorage.getItem(`campaigns_cache_${shopId}`);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(true);

  // Sync state to local storage whenever it changes
  useEffect(() => {
    if (shopId && campaigns.length > 0) {
      localStorage.setItem(`campaigns_cache_${shopId}`, JSON.stringify(campaigns));
    }
  }, [campaigns, shopId]);

  useEffect(() => {
    if (shopId) {
       fetchCampaigns();
    } else {
       setLoading(false);
    }
  }, [shopId]);

  async function fetchCampaigns() {
    if (!supabase || !shopId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setCampaigns(data);
        localStorage.setItem(`campaigns_cache_${shopId}`, JSON.stringify(data));
      } else if (error) {
        console.error("Failed to sync campaigns from Supabase:", error);
      }
    } catch (err) {
      console.warn("Offline fetch fallback active:", err);
    } finally {
      setLoading(false);
    }
  }

  async function addCampaign(newCampaign) {
    if (!navigator.onLine) {
        alert("You must be online to create new campaigns.");
        return { error: new Error("Offline") };
    }
    const { data, error } = await supabase
      .from('campaigns')
      .insert({ ...newCampaign, shop_id: shopId })
      .select();
      
    if (!error && data) setCampaigns((prev) => [data[0], ...prev]);
    return { data, error };
  }

  async function updateCampaign(campaignId, updates) {
    if (!navigator.onLine) {
        alert("You must be online to update campaigns.");
        return { error: new Error("Offline") };
    }
    const { data, error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', campaignId)
      .select();
      
    if (!error && data) {
      setCampaigns((prev) => prev.map((c) => (c.id === campaignId ? data[0] : c)));
    }
    return { data, error };
  }

  async function deleteCampaign(campaignId) {
    if (!navigator.onLine) {
        alert("You must be online to delete campaigns.");
        return { error: new Error("Offline") };
    }
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignId);
      
    if (!error) {
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
    }
    return { error };
  }

  return { campaigns, loading, fetchCampaigns, addCampaign, updateCampaign, deleteCampaign };
}
