import { supabase } from "../services/supabase-client";

// Re-export the existing singleton to ensure only ONE GoTrueClient exists
export { supabase };

/**
 * Log a telemetry event to the events table.
 * @param {object} event - Event payload (event_type, qr_id, shop_id, metadata, etc.)
 */
export async function logEvent(event) {
  if (!supabase) return null;
  const { data, error } = await supabase.from("events").insert(event);
  if (error) console.error("Event logging error", error);
  return data;
}

/**
 * Fetch QR node data by its ID.
 * @param {string} qrId - The QR node identifier
 */
export async function fetchMenu(qrId) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("qrs")
    .select("qr_id, action_type, shop_id")
    .eq("qr_id", qrId)
    .single();
  if (error) console.error(error);
  return data;
}
