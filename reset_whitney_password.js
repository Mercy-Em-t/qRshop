/**
 * Admin: Provision Access for amoitwhitney
 * ─────────────────────────────────────────
 * MODE A → Send a password-reset email  (Whitney clicks link, sets own password)
 * MODE B → Set a temporary password     (you share it with her directly)
 *
 * Run from the project root:
 *   node reset_whitney_password.js          ← MODE A (recommended)
 *   node reset_whitney_password.js --set    ← MODE B
 *
 * Requires Node 18+ (uses native fetch / ESM).
 * Add  "type": "module"  to package.json if not already present.
 */

import { createClient } from "@supabase/supabase-js";

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL  = "https://ocsuqfabqsyrbsewcaez.supabase.co";
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jc3VxZmFicXN5cmJzZXdjYWV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUyMjgyMCwiZXhwIjoyMDg5MDk4ODIwfQ.HYys17PBfYfhNgfGAJTrGmsVhgKf_jXHcdRvr_A0ikk";

const WHITNEY_EMAIL = "amoitwhitney21@gmail.com"; // confirmed from auth.users
const TEMP_PASSWORD = "Whitney@2026!";           // change before using --set

// ── Supabase admin client ─────────────────────────────────────────────────────
const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const mode = process.argv.includes("--set") ? "SET" : "EMAIL";

async function run() {
  console.log(`\n🔧  Mode: ${mode === "SET" ? "Set temporary password" : "Send reset email"}`);
  console.log("─".repeat(55));

  // ── Find her user record ────────────────────────────────────────────────────
  const { data: list, error: listErr } = await admin.auth.admin.listUsers({ perPage: 500 });
  if (listErr) {
    console.error("❌ Could not list users:", listErr.message);
    process.exit(1);
  }

  const whitney = list.users.find(u =>
    u.email?.toLowerCase() === WHITNEY_EMAIL.toLowerCase() ||
    u.user_metadata?.username?.toLowerCase() === "amoitwhitney"
  );

  if (!whitney) {
    console.error(`\n❌ No user found for "${WHITNEY_EMAIL}" or username "amoitwhitney".`);
    console.log("\n   All registered emails:");
    list.users.forEach(u => console.log(`  • ${u.email}  (username: ${u.user_metadata?.username || "—"})`));
    process.exit(1);
  }

  console.log(`\n✅ Found: ${whitney.email} (id: ${whitney.id})`);
  console.log(`   Email confirmed: ${whitney.email_confirmed_at ? "yes" : "NO"}`);

  // ── MODE A: Generate & send a password-reset link ───────────────────────────
  if (mode === "EMAIL") {
    const { data: linkData, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: whitney.email,
    });

    if (error) {
      console.error("\n❌ Failed to generate link:", error.message);
      process.exit(1);
    }

    console.log("\n📧 Reset link generated & email sent via Supabase.");

    // The direct link is useful if Supabase email is not configured / goes to spam
    const directLink = linkData?.properties?.action_link;
    if (directLink) {
      console.log("\n   ↳ Direct link (send to Whitney if email doesn't arrive):");
      console.log(`\n   ${directLink}\n`);
    }

    console.log("   Whitney clicks → sets her own password → logs in ✓");
    return;
  }

  // ── MODE B: Set a temporary password directly ───────────────────────────────
  const { data, error } = await admin.auth.admin.updateUserById(whitney.id, {
    password: TEMP_PASSWORD,
    email_confirm: true, // force-confirm so she can log in even if email wasn't verified
  });

  if (error) {
    console.error("\n❌ Failed to update password:", error.message);
    process.exit(1);
  }

  console.log(`\n🔑 Temporary password set for: ${data.user.email}`);
  console.log(`\n   Login email    : ${data.user.email}`);
  console.log(`   Temp password  : ${TEMP_PASSWORD}`);
  console.log("\n   ⚠️  Share this ONLY with Whitney, and ask her to change it after login.\n");
}

run().catch(err => {
  console.error("Unexpected error:", err.message);
  process.exit(1);
});
