import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase-client';

export function useOfflineEventQueue() {
  const [queue, setQueue] = useState([]);

  // Load queued events from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('offlineEvents');
      if (saved) setQueue(JSON.parse(saved));
    } catch {
      // ignore parsing errors
    }
  }, []);

  // Sync queue to localStorage whenever it changes
  useEffect(() => {
    try {
      if (queue.length > 0) {
        localStorage.setItem('offlineEvents', JSON.stringify(queue));
      } else {
        localStorage.removeItem('offlineEvents');
      }
    } catch {
      // ignore storage fullness
    }
  }, [queue]);

  // Flush queue to Supabase
  const flushQueue = useCallback(async () => {
    if (!navigator.onLine || !queue.length) return;
    
    // Copy queue and try to insert all
    const copy = [...queue];
    for (const event of copy) {
      if (!supabase) continue;
      
      const { error } = await supabase.from('events').insert(event);
      if (!error) {
        // Remove successfully synced event from queue
        setQueue((prev) => prev.filter((e) => e.id !== event.id));
      }
    }
  }, [queue]);

  // Automatically flush when device regains network
  useEffect(() => {
    window.addEventListener('online', flushQueue);
    return () => window.removeEventListener('online', flushQueue);
  }, [flushQueue]);

  // Add event to queue (or flush immediately if online)
  const enqueueEvent = async (event) => {
    if (navigator.onLine && supabase) {
      const { error } = await supabase.from('events').insert(event);
      if (error) {
        // Fallback to queue if db insertion fails specifically
        setQueue((prev) => [...prev, event]);
      }
    } else {
      // Offline, push straight to local queue
      setQueue((prev) => [...prev, event]);
    }
  };

  return { queue, enqueueEvent, flushQueue };
}
