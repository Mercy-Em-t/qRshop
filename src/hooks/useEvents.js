import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase-client';

export function useEvents(qrId) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (qrId) fetchEvents();
  }, [qrId]);

  async function fetchEvents() {
    setLoading(true);
    if (!supabase) {
      setEvents([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('qr_id', qrId)
      .order('timestamp', { ascending: false });

    if (!error) setEvents(data || []);
    setLoading(false);
  }

  // Derive basic analytics over the event stream
  const scans = events.filter((e) => e.event_type === 'qr_scanned').length || 1;
  const orders = events.filter((e) => e.event_type === 'order_started' || e.event_type === 'order_completed').length;
  const conversionRate = events.length > 0 ? orders / scans : 0;

  return { events, loading, conversionRate, fetchEvents };
}
