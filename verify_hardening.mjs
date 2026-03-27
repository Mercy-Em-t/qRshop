import { createClient } from "@supabase/supabase-js";
import fs from 'fs';
import path from 'path';

// Manual .env.local loader to avoid 'dotenv' dependency
function loadEnv() {
  try {
    const envPath = path.resolve('.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length === 2) {
        env[parts[0].trim()] = parts[1].trim();
      }
    });
    return env;
  } catch (err) {
    console.error("Failed to read .env.local:", err.message);
    return {};
  }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ ERROR: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not found in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifySecurity() {
  console.log("--- 🕵️ Security Verification Script 🕵️ ---");
  console.log("Testing as: ANONYMOUS / PUBLIC (using VITE_SUPABASE_ANON_KEY)");
  
  // 1. Attempt to fetch all shop_users
  console.log("\n[1] Checking shop_users table leak...");
  const { data: users, error: userError } = await supabase
    .from("shop_users")
    .select("*");
    
  if (userError) {
    if (userError.code === '42501' || userError.message.includes('permission denied')) {
      console.log("✅ SUCCESS: shop_users policy restricted. Permission denied as expected.");
    } else {
      console.error("❌ ERROR: Unexpected error fetching shop_users:", userError.message, userError.code);
    }
  } else if (users && users.length > 0) {
    console.warn("⚠️  VULNERABILITY DETECTED: Fetched " + users.length + " users!");
    // Log minimal info for privacy but enough to prove the point
    console.table(users.map(u => ({ email: u.email, role: u.role, pass_exposed: !!u.password })));
    console.log("\nACTION: Please run d:\\SHOPQR\\supabase_final_hardening.sql in your Supabase SQL Editor immediately.");
  } else {
    console.log("✅ SUCCESS: No user data leaked (table might be empty or restricted).");
  }

  // 2. Checking if shops are still readable (they should be, but filtered)
  console.log("\n[2] Checking shops table readability (Marketplace)...");
  const { data: shops, error: shopError } = await supabase
    .from("shops")
    .select("name, marketplace_status");

  if (shopError) {
    console.error("❌ ERROR: Failed to fetch shops:", shopError.message);
  } else {
    console.log("✅ INFO: Read " + shops.length + " shops via marketplace policy.");
    const approved = shops.filter(s => s.marketplace_status === 'approved').length;
    console.log(`(Of which ${approved} are 'approved' and should be public)`);
  }

  console.log("\n--- Verification Complete ---");
}

verifySecurity();
