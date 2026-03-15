import { supabase } from "./supabase-client";
import { getOrCreateDeviceId, getOrCreateTrackingSession } from "../utils/qr-session";

export async function logEvent(
  eventType,
  qrId,
  shopId,
  deviceInfo = navigator.userAgent,
  extraMetadata = {}
) {
  if (!supabase) return null;

  // Pull the identity chain parameters automatically
  const deviceId = getOrCreateDeviceId();
  const sessionId = getOrCreateTrackingSession();

  const newEvent = {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7),
    event_type: eventType,
    qr_id: qrId,
    shop_id: shopId,
    session_id: sessionId,
    device_id: deviceId,
    // Note: user_id and visit_id are not in the base public.events schema
    // so we pack them safely into device_info until the V3 schema is manually applied
    device_info: {
      userAgent: deviceInfo,
      user_id: extraMetadata.user_id || null,
      visit_id: extraMetadata.visit_id || null,
      ...Object.fromEntries(
        Object.entries(extraMetadata).filter(
          ([key]) => key !== "user_id" && key !== "visit_id"
        )
      ),
    },
  };

  const enqueueFallback = (evt) => {
    try {
      const saved = localStorage.getItem('offlineEvents');
      const queue = saved ? JSON.parse(saved) : [];
      queue.push(evt);
      localStorage.setItem('offlineEvents', JSON.stringify(queue));
    } catch {
      // ignore
    }
  };

  // We intentionally fire-and-forget telemetry generally, but await here inside the service so clients can handle drops if they want.
  if (!navigator.onLine) {
    enqueueFallback(newEvent);
    return null;
  }

  const { data, error } = await supabase.from("events").insert([newEvent]);

  if (error) {
    enqueueFallback(newEvent);
  }

  return data;
}

export async function getQrMetrics(qrId) {
  if (!supabase) return { totalScans: 0 };

  // For minimum viable, we count events on the fly. 
  // In a massive scale app, this would query a pre-computed qr_metrics table.
  const { count, error } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("qr_id", qrId)
    .eq("event_type", "qr_scanned");

  if (error) {
    console.error("Error fetching QR metrics:", error);
    return { totalScans: 0 };
  }

  return { totalScans: count || 0 };
}
