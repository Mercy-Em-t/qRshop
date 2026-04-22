import { supabase } from "./supabase-client";

function generateShortId(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createQrNode(shopId, location, action = "open_menu") {
  if (!supabase) return null;

  const qr_id = generateShortId();
  const newNode = {
    qr_id,
    shop_id: shopId,
    location,
    action,
    status: "active",
  };

  const { data, error } = await supabase
    .from("qrs")
    .insert([newNode])
    .select("*, id:qr_id")
    .single();

  if (error) {
    console.error("Error creating QR node:", error);
    throw error;
  }

  return data;
}

export async function getShopQrs(shopId) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("qrs")
    .select("*, id:qr_id")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching shop QRs:", error);
    return [];
  }

  if (!data) return [];
  return data.map(q => ({
    ...q,
    qr_id: q.qr_id || q.id,
    id: q.id || q.qr_id,
    action: q.action || q.action_type || 'open_menu',
    location: q.location || 'Unknown Location'
  }));
}

export async function getQrNode(qrId) {
  if (!supabase || !qrId) return null;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(qrId);

  // If it's not a UUID and not a 6-char ShortID (if still used), it might be a slug.
  // We only query the DB if it matches the expected identity formats to avoid type errors.
  if (!isUUID && qrId.length !== 6) return null;

  const { data, error } = await supabase
    .from("qrs")
    .select("*, id:qr_id")
    .eq("qr_id", qrId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching QR node:", error);
    return null;
  }

  if (!data) return null;
  return {
    ...data,
    qr_id: data.qr_id || data.id,
    id: data.id || data.qr_id,
    action: data.action || data.action_type || 'open_menu',
    location: data.location || 'Unknown Location'
  };
}
