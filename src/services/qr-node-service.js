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

  return data || [];
}

export async function getQrNode(qrId) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("qrs")
    .select("*, id:qr_id")
    .eq("qr_id", qrId)
    .single();

  if (error) {
    console.error("Error fetching QR node:", error);
    return null;
  }

  return data;
}
