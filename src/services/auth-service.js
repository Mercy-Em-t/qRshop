import { supabase } from "./supabase-client";

// This securely verifies a user against the shop_users table and returns their active shop_id and role
export async function authenticateUser(email, password) {
  if (!supabase) return { error: "Supabase not connected." };

  // Note: For MVP we manually check the table.
  // In V6 production, we will migrate this to Supabase Native Auth (Auth.users) securely.
  const { data, error } = await supabase
    .from("shop_users")
    .select("*, shops(*)")
    .eq("email", email)
    .single();

  if (error || !data) {
    return { error: "Invalid email or credentials." };
  }

  // Basic plaintext check for MVP scaling - strongly recommend BCrypt/Native Auth next!
  if (data.password !== password) {
    return { error: "Invalid password." };
  }

  // Persist the session locally
  const sessionUser = {
    id: data.id,
    email: data.email,
    role: data.role,
    shop_id: data.shop_id,
    shops: data.shops
  };

  localStorage.setItem("qrshop_session", JSON.stringify(sessionUser));
  return { user: sessionUser };
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem("qrshop_session");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem("qrshop_session");
}
