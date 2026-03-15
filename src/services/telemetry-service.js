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
    event_type: eventType,
    qr_id: qrId,
    shop_id: shopId,
    session_id: sessionId,
    device_id: deviceId,
    user_id: extraMetadata.user_id || null,
    visit_id: extraMetadata.visit_id || null,
    metadata: {
      userAgent: deviceInfo,
      ...extraMetadata,
    },
  };

  // We intentionally fire-and-forget telemetry generally, but await here inside the service so clients can handle drops if they want.
  const { data, error } = await supabase.from("events").insert([newEvent]);

  if (error) {
    console.error("Error logging telemetry event:", error);
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
