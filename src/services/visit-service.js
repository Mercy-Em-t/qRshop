import { supabase } from "./supabase-client";
import { getOrCreateDeviceId, getOrCreateTrackingSession } from "../utils/qr-session";

/**
 * Log a visit record to the visits table.
 * @param {string} qrId - The QR node that was scanned
 * @param {string} shopId - The shop associated with this QR
 * @param {string} [deploymentId] - Optional deployment ID
 */
export async function logVisit(qrId, shopId, deploymentId = null) {
  if (!supabase) return null;

  const deviceId = getOrCreateDeviceId();
  const sessionId = getOrCreateTrackingSession();

  const visit = {
    qr_id: qrId,
    shop_id: shopId,
    deployment_id: deploymentId,
    session_id: sessionId,
    device_id: deviceId,
  };

  const { data, error } = await supabase
    .from("visits")
    .insert([visit])
    .select()
    .single();

  if (error) {
    console.error("Error logging visit:", error);
    return null;
  }

  return data;
}

/**
 * End a visit by setting visit_end timestamp.
 * @param {string} visitId - The visit to end
 */
export async function endVisit(visitId) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("visits")
    .update({ visit_end: new Date().toISOString() })
    .eq("visit_id", visitId)
    .select()
    .single();

  if (error) {
    console.error("Error ending visit:", error);
    return null;
  }

  return data;
}

/**
 * Get visits for a specific QR node.
 * @param {string} qrId - The QR node ID
 * @param {number} [limit=50] - Max results
 */
export async function getVisitsByQr(qrId, limit = 50) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("visits")
    .select("*")
    .eq("qr_id", qrId)
    .order("visit_start", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching visits:", error);
    return [];
  }

  return data || [];
}
