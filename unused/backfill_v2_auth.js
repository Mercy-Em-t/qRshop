/**
 * V2 Auth Layer Backfill Script
 * ─────────────────────────────────────────
 * This script migrates existing data from:
 * 1. auth.users -> profiles
 * 2. shop_users -> shop_members
 * 
 * Run from the project root:
 *   node backfill_v2_auth.js
 */

import { createClient } from "@supabase/supabase-js";

// ── Config (Using existing service role key) ──────────────────────────────────
const SUPABASE_URL  = "https://ocsuqfabqsyrbsewcaez.supabase.co";
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jc3VxZmFicXN5cmJzZXdjYWV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUyMjgyMCwiZXhwIjoyMDg5MDk4ODIwfQ.HYys17PBfYfhNgfGAJTrGmsVhgKf_jXHcdRvr_A0ikk";

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function withRetry(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`\n⚠️  Retrying after error: ${err.message}. Attempt ${i + 1}/${retries}...`);
      await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
    }
  }
}

async function run() {
  console.log("\n🚀 Starting V2 Auth Layer Backfill...\n");

  // ── Step 1: Migrate auth.users to profiles ─────────────────────────────────
  console.log("Phase 1: Migrating auth.users to profiles...");
  const { data: { users }, error: listErr } = await withRetry(() => admin.auth.admin.listUsers({ perPage: 1000 }));
  if (listErr) { console.error("❌ Could not list auth users:", listErr.message); process.exit(1); }

  console.log(`Found ${users.length} users in auth.users.`);

  for (const user of users) {
    const { error: profileErr } = await admin
      .from("profiles")
      .upsert({
        id: user.id,
        display_name: user.user_metadata?.full_name || user.user_metadata?.username || user.email?.split('@')[0],
        system_role: user.user_metadata?.role === 'system_admin' ? 'system_admin' : 'user',
        created_at: user.created_at,
        updated_at: user.last_sign_in_at || user.created_at
      }, { onConflict: 'id' });

    if (profileErr) {
      console.warn(`⚠️  Failed to upsert profile for ${user.email}:`, profileErr.message);
    } else {
      process.stdout.write(".");
    }
  }
  console.log("\n✅ Phase 1 Complete: Profiles synchronized.");

  // ── Step 2: Migrate shop_users to shop_members ────────────────────────────
  console.log("\nPhase 2: Migrating shop_users to shop_members...");
  const { data: shopUsers, error: suErr } = await admin
    .from("shop_users")
    .select("*");

  if (suErr) { console.error("❌ Could not fetch shop_users:", suErr.message); process.exit(1); }

  console.log(`Found ${shopUsers.length} records in shop_users.`);

  for (const su of shopUsers) {
    // Map roles: 'shop_owner' -> 'owner', others to lowercase
    const mappedRole = su.role === 'shop_owner' ? 'owner' : (su.role?.toLowerCase() || 'staff');

    const { error: memberErr } = await admin
      .from("shop_members")
      .upsert({
        user_id: su.id,
        shop_id: su.shop_id,
        role: mappedRole,
        is_active: su.is_active !== false,
        joined_at: su.created_at || new Date().toISOString()
      }, { onConflict: 'user_id,shop_id' });

    if (memberErr) {
      console.warn(`⚠️  Failed to migrate membership for user ${su.email || su.id} in shop ${su.shop_id}:`, memberErr.message);
    } else {
      process.stdout.write(".");
    }
    
    // throttle slightly
    await new Promise(r => setTimeout(r, 100));
  }
  console.log("\n✅ Phase 2 Complete: Memberships synchronized.");
  
  console.log("\n🎊 V2 Auth Layer Backfill Successful!");
}

run().catch(err => {
  console.error("\n❌ Unexpected error during backfill:", err);
  process.exit(1);
});
