import { createClient } from "@supabase/supabase-js";
import fs from 'fs';
import path from 'path';

function loadEnv() {
  try {
    const envPath = path.resolve('.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
      }
    });
    return env;
  } catch (err) {
    return {};
  }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function debug() {
  console.log("--- 🕵️ Promotions Table Debug 🕵️ ---");

  // 1. Check Columns
  console.log("\n[1] Checking Columns:");
  const { data: columns, error: colErr } = await supabase.rpc('query_columns', { table_name: 'promotions' });
  
  // If RPC doesn't exist, try direct SQL via another method or just try to insert a dummy row.
  if (colErr) {
    console.log("RPC 'query_columns' missing. Trying direct query...");
    const { data: cols, error: err } = await supabase.from('promotions').select('*').limit(1);
    if (err) {
      console.error("Error selecting from promotions:", err.message);
    } else {
      console.log("Columns found via select:", Object.keys(cols[0] || {}));
    }
  } else {
    console.log(columns);
  }

  // 2. Check current policies (if possible via RPC or system tables)
  console.log("\n[2] Checking RLS Policies (pg_policies):");
  const { data: policies, error: polErr } = await supabase.rpc('get_table_policies', { table_name: 'promotions' });
  if (polErr) {
    console.log("RPC 'get_table_policies' missing.");
  } else {
    console.log(policies);
  }

  // 3. Test a dummy insert for a supplier
  console.log("\n[3] Testing insert for a supplier (no shop_id):");
  const { error: insErr } = await supabase.from('promotions').insert({
    name: "Debug Promo",
    is_active: true
    // shop_id is NOT NULL, so this should fail anyway if it's missing.
  });
  console.log("Insert result (no shop_id):", insErr ? insErr.message : "Success (unexpected)");
}

debug();
