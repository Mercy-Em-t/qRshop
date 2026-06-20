import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectShops() {
  console.log("--- Inspecting Shops for Emmercy ---");
  
  // 1. Find user by email
  const { data: users, error: uErr } = await supabase
    .from('shop_users')
    .select('*, shops(*)')
    .ilike('email', 'emmercy65@gmail.com');

  if (uErr) {
    console.error("Error finding user profiles:", uErr);
    return;
  }

  console.log(`Found ${users.length} shop associations:`);
  users.forEach(u => {
    console.log(`- Shop Name: ${u.shops?.name}, Shop ID: ${u.shop_id}, Role: ${u.role}`);
  });

  // 2. Deep check on the shops themselves
  const auraWords = ['aura', 'co'];
  const { data: auraShops } = await supabase.from('shops').select('*').ilike('name', '%aura%');
  console.log("\nAura Related Shops in DB:");
  auraShops.forEach(s => {
    console.log(`- ID: ${s.shop_id}, Name: ${s.name}, Subdomain: ${s.subdomain}`);
  });

  const rosyShops = await supabase.from('shops').select('*').ilike('name', '%rosy%');
  console.log("\nRosy Related Shops in DB:");
  rosyShops.data.forEach(s => {
    console.log(`- ID: ${s.shop_id}, Name: ${s.name}, Subdomain: ${s.subdomain}`);
  });
}

inspectShops();
