import { supabase } from "./supabase-client";
import { getProfile, getShopMemberships } from "./profile-service";

// Internal cache for the session user (Renamed to force fresh bundle scope)
let authStaticCache = null;

// This securely verifies a user against Supabase Native Auth and returns their active shop_id and role
export async function authenticateUser(email, password) {
  if (!supabase) return { error: "Supabase not connected." };

  // Phase 0: Clear any existing sessions to prevent hand-off deadlocks
  console.log("Auth [v2.4.1-deploy-2015]: Clearing stale session...");
  await supabase.auth.signOut();
  localStorage.removeItem("savannah_session");
  authStaticCache = null;

  // Phase 1: Authenticate natively against Supabase Auth (with Timeout Guard)
  console.log("Auth [v2.4.1-deploy-2015]: Initiating native signIn for", email.trim());
  
  const authPromise = supabase.auth.signInWithPassword({
    email: email.trim(),
    password: password, 
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

  console.log("Auth [v2.4.1-deploy-2015]: Native success, fetching V2 profiles for ID:", authData.user.id);

  // Phase 2: Fetch V2 Profile and Shop Memberships
  const [profile, memberships] = await Promise.all([
    getProfile(authData.user.id),
    getShopMemberships(authData.user.id)
  ]);

  if (!profile) {
    console.error("Auth: Profile missing for authenticated user.");
    await supabase.auth.signOut();
    return { error: "User profile missing. Contact support." };
  }

  console.log(`Auth [v2.4.1-deploy-2015]: Profile found for ${profile.display_name}. ${memberships.length} memberships.`);

  // If multiple shops, we return them all and let the UI handle selection
  if (memberships.length > 1) {
    return { 
      user: { 
        id: authData.user.id, 
        email: authData.user.email,
        display_name: profile.display_name,
        system_role: profile.system_role
      }, 
      profiles: memberships.map(m => ({
        shop_id: m.shop_id,
        email: authData.user.email,
        role: m.role,
        shop_name: m.shops?.name,
        subdomain: m.shops?.subdomain,
        is_v2: true
      })),
      requiresSelection: true 
    };
  }

  // Handle single shop or no shop cases
  const membership = memberships[0] || null;
  const sessionUser = {
    id: authData.user.id,
    email: authData.user.email,
    display_name: profile.display_name,
    role: membership?.role || 'user',
    system_role: profile.system_role,
    shop_id: membership?.shop_id || null,
    shop_name: membership?.shops?.name || null
  };

  localStorage.setItem("savannah_session", JSON.stringify(sessionUser));
  authStaticCache = sessionUser;
}

export function getCurrentUser() {

  try {
    const raw = localStorage.getItem("savannah_session");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function logout() {
  await supabase.auth.signOut();
  localStorage.removeItem("savannah_session");
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
