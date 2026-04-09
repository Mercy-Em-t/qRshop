import { supabase } from "./supabase-client";

// This securely verifies a user against Supabase Native Auth and returns their active shop_id and role
export async function authenticateUser(email, password) {
  if (!supabase) return { error: "Supabase not connected." };

  // Phase 0: Clear any existing sessions to prevent hand-off deadlocks
  console.log("Auth: Clearing stale session before login handshake...");
  await supabase.auth.signOut();
  localStorage.removeItem("qrshop_session");

  // Phase 1: Authenticate natively against Supabase Auth (with Timeout Guard)
  console.log("Auth: Initiating native signIn for", email.trim());
  
  const authPromise = supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password, // Do NOT trim passwords, they may contain spaces
  });

  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("Supabase Auth Handshake Timed Out (10s)")), 10000)
  );

  let authData, authError;

  try {
    const result = await Promise.race([authPromise, timeoutPromise]);
    authData = result.data;
    authError = result.error;
  } catch (err) {
    console.error("Auth: Direct exception or timeout", err);
    return { error: err.message };
  }

  if (authError || !authData.user) {
    console.error("Auth: Native signIn failed", authError);
    return { error: authError?.message || "Invalid credentials." };
  }

  console.log("Auth: Native success, fetching shop_user profile for ID:", authData.user.id);

  // Phase 2: Fetch minimal metadata (No Joins)
  const { data: shopUser, error: suError } = await supabase
    .from("shop_users")
    .select("email, role, shop_id")
    .eq("id", authData.user.id)
    .single();

  if (suError || !shopUser) {
    console.error("Auth: Profile fetch failed", suError);
    await supabase.auth.signOut();
    return { error: "User profile missing or access denied." };
  }

  console.log("Auth: Profile found, link to shop:", shopUser.shop_id);

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

/**
 * Register a new customer via Supabase Auth.
 */
export async function signUpUser(email, password, metadata = {}) {
  if (!supabase) return { error: "Supabase not connected." };

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        ...metadata,
        role: 'customer'
      }
    }
  });

  if (error) return { error: error.message };
  return { user: data.user };
}

/**
 * Reconciles local guest orders by assigning them to the newly logged-in user.
 */
export async function claimGuestOrders(user) {
  if (!user || !supabase) return;
  
  try {
    const localHistoryIds = JSON.parse(localStorage.getItem('customer_history') || '[]');
    if (localHistoryIds.length === 0) return;

    console.log(`Claming ${localHistoryIds.length} guest orders for user ${user.id}...`);

    const { error } = await supabase
      .from("orders")
      .update({ user_id: user.id })
      .in('id', localHistoryIds);

    if (error) {
      console.warn("Failed to claim some guest orders:", error);
    }
  } catch (err) {
    console.error("Identity reconciliation failed:", err);
  }
}
