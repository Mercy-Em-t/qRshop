import { supabase } from "./supabase-client";

/**
 * Validate a QR session server-side by creating a record in qr_sessions.
 * Returns the session object if valid, null otherwise.
 */
export async function validateQrSession(shopId, tableId, deviceId) {
  if (!supabase) {
    // Fallback: return a local session when Supabase is not configured
    return {
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      shop_id: shopId,
      table_id: tableId,
      device_id: deviceId,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      status: "active",
    };
  }

  // Expire any existing sessions for this device at this table
  await supabase
    .from("qr_sessions")
    .update({ status: "expired" })
    .eq("device_id", deviceId)
    .eq("shop_id", shopId)
    .eq("status", "active");

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("qr_sessions")
    .insert({
      shop_id: shopId,
      table_id: tableId,
      device_id: deviceId,
      expires_at: expiresAt,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating QR session:", error);
    return null;
  }

  return data;
}

/**
 * Check if an existing QR session is still valid (not expired, still active).
 */
export async function checkQrSessionValid(sessionId) {
  if (!supabase) return true;

  const { data, error } = await supabase
    .from("qr_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("status", "active")
    .single();

  if (error || !data) return false;

  return new Date(data.expires_at) > new Date();
}

/**
 * Generate a device ID. Persisted in localStorage so the same device
 * keeps a consistent identifier.
 */
export function getDeviceId() {
  const key = "qr_device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    localStorage.setItem(key, id);
  }
  return id;
}
