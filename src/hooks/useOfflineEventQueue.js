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
        
        const { error, status } = await supabase.from('events').insert(event);
        
        // Error handling strategy:
        // - No error: Success, remove from queue.
        // - 409 Conflict: Event already exists, remove from queue.
        // - 400 Bad Request: Malformed event, remove from queue (it will never succeed).
        // - 403/401: Unauthorized, remove from queue (permission issue).
        // - Other (5xx or network drop): Keep in queue and try again later.
        
        const isClientError = (status >= 400 && status < 500) || error?.status === 409 || error?.code === '23505';

        if (!error || isClientError) {
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
