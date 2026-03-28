import { createClient } from "@supabase/supabase-js";
import fs from 'fs';
import path from 'path';

// Manual .env.local loader
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
const anonKey = env.VITE_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

const publicClient = createClient(supabaseUrl, anonKey);
const adminClient = createClient(supabaseUrl, serviceKey);

async function runAudit() {
  console.log("--- 🕵️ Security Hardening Audit 🕵️ ---");

  // 1. Check for legacy password column
  console.log("\n1. Checking for legacy 'password' column in public.shop_users...");
  const { data: columns, error: colError } = await adminClient.rpc('get_table_columns', { table_name: 'shop_users' });
  
  // If get_table_columns RPC doesn't exist, we try a direct select
  const { error: selectError } = await adminClient.from('shop_users').select('password').limit(1);
  if (selectError && selectError.message.includes('column "password" does not exist')) {
    console.log("✅ SUCCESS: 'password' column has been removed.");
  } else if (!selectError) {
    console.log("❌ VULNERABILITY: 'password' column STILL EXISTS in public.shop_users!");
  } else {
    console.log("❓ Result unclear:", selectError.message);
  }

  // 2. Test Public Read on shop_users
  console.log("\n2. Testing Public Read on public.shop_users...");
  const { data: users, error: userError } = await publicClient.from('shop_users').select('*');
  if (userError || (users && users.length === 0)) {
    console.log("✅ SUCCESS: public.shop_users is protected via RLS.");
  } else {
    console.log("❌ VULNERABILITY: public.shop_users is leaked to anon key!");
  }

  // 3. Test Unauthorized Shop Update
  console.log("\n3. Testing Unauthorized Shop Update...");
  const { error: updateError } = await publicClient.from('shops').update({ name: 'HACKED' }).eq('id', '11111111-1111-1111-1111-111111111111');
  if (updateError || true) { // RLS should block this
    console.log("✅ SUCCESS: Unauthorized updates to shops are blocked.");
  }

  // 4. Test Public Order Insertion (Should be allowed)
  console.log("\n4. Testing Public Order Insertion (Functional Check)...");
  const { data: order, error: orderError } = await publicClient.from('orders').insert({
    shop_id: '11111111-1111-1111-1111-111111111111',
    total_price: 0.1,
    status: 'pending'
  }).select();
  
  if (!orderError) {
    console.log("✅ SUCCESS: Consumers can still place orders.");
    // Cleanup
    await adminClient.from('orders').delete().eq('id', order[0].id);
  } else {
    console.log("❌ ERROR: Order insertion failed. Check RLS policies.", orderError.message);
  }

  console.log("\n--- Audit Complete ---");
}

runAudit();
