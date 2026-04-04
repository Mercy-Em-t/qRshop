import { supabase } from "./supabase-client";

// This securely verifies a user against Supabase Native Auth and returns their active shop_id and role
export async function authenticateUser(email, password) {
  if (!supabase) return { error: "Supabase not connected." };

  // Phase 1: Authenticate natively against Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (authError || !authData.user) {
    return { error: authError?.message || "Invalid credentials." };
  }

  // Phase 2: Fetch minimal metadata (No Joins)
  // Loading the specific shop details happens on the dashboard to speed up login.
  const { data: shopUser, error: suError } = await supabase
    .from("shop_users")
    .select("email, role, shop_id")
    .eq("id", authData.user.id)
    .single();

  if (suError || !shopUser) {
    await supabase.auth.signOut();
    return { error: "User profile missing or access denied." };
  }

  const sessionUser = {
    id: authData.user.id,
    email: shopUser.email,
    role: shopUser.role,
    shop_id: shopUser.shop_id
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
