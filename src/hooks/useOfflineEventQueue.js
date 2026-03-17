import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase-client';

export function useOfflineEventQueue() {
  const [queue, setQueue] = useState([]);

  const loadQueue = useCallback(() => {
    try {
      const saved = localStorage.getItem('offlineEvents');
      if (saved) setQueue(JSON.parse(saved));
    } catch {}
  }, []);

  // Load queued events from localStorage on mount
  useEffect(() => {
    loadQueue();
    // Also listen to storage events from other tabs or manual triggers
    window.addEventListener('storage', loadQueue);
    window.addEventListener('offline_event_added', loadQueue);
    return () => {
      window.removeEventListener('storage', loadQueue);
      window.removeEventListener('offline_event_added', loadQueue);
    };
  }, [loadQueue]);

  // Flush queue to Supabase
  const flushQueue = useCallback(async () => {
    if (!navigator.onLine) return;
    
    try {
      const saved = localStorage.getItem('offlineEvents');
      let currentQueue = saved ? JSON.parse(saved) : [];
      if (!currentQueue.length) return;
      
      let pendingQueue = [...currentQueue];
      for (const event of currentQueue) {
        if (!supabase) continue;
        
        const { error } = await supabase.from('events').insert(event);
        if (!error) {
          pendingQueue = pendingQueue.filter((e) => e.id !== event.id);
        }
      }
      
      if (pendingQueue.length > 0) {
        localStorage.setItem('offlineEvents', JSON.stringify(pendingQueue));
      } else {
        localStorage.removeItem('offlineEvents');
      }
      setQueue(pendingQueue);
    } catch (err) {
      console.error("Flush queue error:", err);
    }
  }, []);

  // Automatically flush when device regains network
  useEffect(() => {
    window.addEventListener('online', flushQueue);
    // Try flushing on mount if online
    if (navigator.onLine) flushQueue();
    return () => window.removeEventListener('online', flushQueue);
  }, [flushQueue]);

  return { queue, flushQueue };
}
