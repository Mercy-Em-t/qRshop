import { supabase } from "./supabase-client";

// This securely verifies a user against Supabase Native Auth and returns their active shop_id and role
export async function authenticateUser(email, password) {
  if (!supabase) return { error: "Supabase not connected." };

  // Phase 0: Check Rate Limit (Max 3 attempts in 15 mins)
  const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { count: failedCount, error: countError } = await supabase
    .from("login_attempts")
    .select("*", { count: 'exact', head: true })
    .eq("email", email)
    .gt("created_at", fifteenMinsAgo);

  if (!countError && failedCount >= 3) {
    return { error: "Too many failed attempts. Access locked for 15 minutes for this email." };
  }

  // Phase 1: Authenticate natively against Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (authError || !authData.user) {
    // Log failed attempt
    await supabase.from("login_attempts").insert([{ email: email }]);
    return { error: authError?.message || "Invalid credentials." };
  }

  // Clear failed attempts on success
  await supabase.from("login_attempts").delete().eq("email", email);


  // Phase 2: Fetch minimal metadata in a single fast query
  // We specify only the necessary fields to reduce payload size and speed up the join.
  const { data: shopUser, error: suError } = await supabase
    .from("shop_users")
    .select(`
      email, 
      role, 
      shop_id, 
      shops (
        id, 
        name, 
        plan
      )
    `)
    .eq("id", authData.user.id)
    .single();

  if (suError || !shopUser) {
    // If the record is missing, we must sign out to prevent orphan sessions
    await supabase.auth.signOut();
    return { error: "User profile missing or access denied." };
  }

  const sessionUser = {
    id: authData.user.id,
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
