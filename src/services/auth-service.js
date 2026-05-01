import { supabase } from "./supabase-client";
import { getShopMemberships } from "./profile-service";

// Internal cache for the session user (Renamed to force fresh bundle scope)
let _authStaticCache = null;

// This securely verifies a user against Supabase Native Auth and returns their active shop_id and role
export async function authenticateUser(email, password) {
  if (!supabase) return { error: "Supabase not connected." };

  // Phase 1: Authenticate natively against Supabase Auth (with Timeout Guard)
  // We no longer force signOut() here; Supabase handles session transition natively.
  console.log("Auth: Initiating native signIn for", email.trim());
  
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

  // Phase 2: Fetch Profile and Shop Memberships in parallel
  const [profileRes, membershipsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", authData.user.id).maybeSingle(),
    getShopMemberships(authData.user.id)
  ]);

  let resolvedProfile = profileRes.data;
  let resolvedMemberships = membershipsRes;

  // Phase 2.5: V1 → V2 Soft Backfill Guard
  if (!resolvedProfile) {
    console.warn("Auth: Profile missing — checking for V1 legacy data...");
    const { data: v1Rows } = await supabase
      .from("shop_users")
      .select("shop_id, role")
      .eq("id", authData.user.id);

    if (v1Rows && v1Rows.length > 0) {
      // 1. Bulk create profile
      const { data: newProfile } = await supabase
        .from("profiles")
        .upsert({
          id: authData.user.id,
          display_name: authData.user.email.split('@')[0],
          system_role: v1Rows.some(r => r.role === 'system_admin') ? 'system_admin' : 'user',
        })
        .select()
        .single();

      // 2. Bulk create shop_members
      const newMemberships = v1Rows.map(row => ({
        user_id: authData.user.id,
        shop_id: row.shop_id,
        role: row.role || 'owner',
        is_active: true,
      }));

      await supabase.from("shop_members").upsert(newMemberships, { onConflict: 'user_id,shop_id' });
      
      resolvedProfile = newProfile;
      resolvedMemberships = await getShopMemberships(authData.user.id);
    }
  }
  if (!resolvedProfile) {
    console.warn("Auth: Profile missing after backfill attempt — generating temporary profile object.");
    resolvedProfile = {
      id: authData.user.id,
      display_name: authData.user.email ? authData.user.email.split('@')[0] : 'User',
      system_role: 'user'
    };
  }

  console.log(`Auth [v2.4.1-deploy-2015]: Profile found for ${resolvedProfile.display_name}. ${resolvedMemberships.length} memberships.`);

  // If multiple shops, return all and let UI handle selection
  if (resolvedMemberships.length > 1) {
    return {
      user: {
        id: authData.user.id,
        email: authData.user.email,
        display_name: resolvedProfile.display_name,
        system_role: resolvedProfile.system_role
      },
      profiles: resolvedMemberships.map(m => ({
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
  const membership = resolvedMemberships[0] || null;
  const sessionUser = {
    id: authData.user.id,
    email: authData.user.email,
    display_name: resolvedProfile.display_name,
    role: membership?.role || 'user',
    system_role: resolvedProfile.system_role,
    shop_id: membership?.shop_id || null,
    shop_name: membership?.shops?.name || null
  };

  localStorage.setItem("savannah_session", JSON.stringify(sessionUser));
  _authStaticCache = sessionUser;
  return { user: sessionUser };
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
