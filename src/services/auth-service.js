import { supabase } from "./supabase-client";

// This securely verifies a user against Supabase Native Auth and returns their active shop_id and role
export async function authenticateUser(email, password) {
  if (!supabase) return { error: "Supabase not connected." };

  // Phase 10: Authenticate natively against Supabase Auth to receive a secure JWT
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (authError || !authData.user) {
    return { error: authError?.message || "Invalid email or credentials." };
  }

  // Fetch shop metadata to ensure role/shop_id is available, bridging the gap
  // between the new Auth provider and existing relational data.
  const { data: shopUser, error: suError } = await supabase
    .from("shop_users")
    .select("*, shops(*)")
    .eq("email", email)
    .single();

  if (suError || !shopUser) {
    return { error: "User profile missing from system bounds." };
  }

  // Persist the session locally to keep existing synchronous hooks perfectly functioning
  const sessionUser = {
    id: authData.user.id, // using genuine Auth UID
    email: shopUser.email,
    role: shopUser.role,
    shop_id: shopUser.shop_id,
    shops: shopUser.shops
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

export async function logout() {
  await supabase.auth.signOut();
  localStorage.removeItem("qrshop_session");
}
