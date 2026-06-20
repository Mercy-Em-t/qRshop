/**
 * Repair: Insert missing shop_users profile for amoitwhitney21@gmail.com
 * Run:  node repair_whitney_profile.js
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ocsuqfabqsyrbsewcaez.supabase.co";
const SERVICE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jc3VxZmFicXN5cmJzZXdjYWV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUyMjgyMCwiZXhwIjoyMDg5MDk4ODIwfQ.HYys17PBfYfhNgfGAJTrGmsVhgKf_jXHcdRvr_A0ikk";

const WHITNEY_EMAIL = "amoitwhitney21@gmail.com";
const WHITNEY_ID    = "b9e67073-9f39-4480-9548-cca86510d66a"; // confirmed from reset script

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  console.log("\n🔍 Checking shop_users for Whitney...\n");

  // 1. Check if she already has a profile
  const { data: existing, error: fetchErr } = await admin
    .from("shop_users")
    .select("*")
    .eq("id", WHITNEY_ID);

  if (fetchErr) {
    console.error("❌ Error reading shop_users:", fetchErr.message);
    process.exit(1);
  }

  if (existing && existing.length > 0) {
    console.log("✅ Whitney already has a shop_users profile:");
    console.table(existing);
    console.log("\nIf she still can't log in, the issue is elsewhere (e.g. RLS policy or shop inactive).");
    process.exit(0);
  }

  console.log("❌ No shop_users row found. Finding her shop...\n");

  // 2. Find her shop by email in the shops table
  const { data: shops, error: shopErr } = await admin
    .from("shops")
    .select("id, name, subdomain, owner_email")
    .ilike("owner_email", "%amoitwhitney%");

  if (shopErr) { console.error("Shop lookup error:", shopErr.message); }

  console.log("Shops matching 'amoitwhitney':");
  console.table(shops || []);

  if (!shops || shops.length === 0) {
    // fallback: list all shops so we can pick the right one
    const { data: allShops } = await admin
      .from("shops")
      .select("id, name, subdomain, owner_email")
      .order("created_at", { ascending: false })
      .limit(20);
    console.log("\nAll recent shops (pick Whitney's):");
    console.table(allShops);
    console.log("\n⚠️  Update SHOP_ID in this script and re-run with --insert flag.");
    process.exit(0);
  }

  const shop = shops[0];
  console.log(`\nUsing shop: "${shop.name}" (${shop.id})`);

  if (!process.argv.includes("--insert")) {
    console.log("\n✋  Dry run. Run with --insert to create the profile row:");
    console.log(`   node repair_whitney_profile.js --insert`);
    process.exit(0);
  }

  // 3. Insert the missing shop_users row
  const { data: inserted, error: insertErr } = await admin
    .from("shop_users")
    .insert({
      id:      WHITNEY_ID,
      shop_id: shop.id,
      email:   WHITNEY_EMAIL,
      role:    "owner",
    })
    .select()
    .single();

  if (insertErr) {
    console.error("❌ Insert failed:", insertErr.message);
    process.exit(1);
  }

  console.log("\n✅ shop_users row created successfully:");
  console.table([inserted]);
  console.log("\nWhitney can now log in with:");
  console.log(`   Email   : ${WHITNEY_EMAIL}`);
  console.log(`   Password: Whitney@2026!\n`);
}

run().catch(e => { console.error(e); process.exit(1); });
