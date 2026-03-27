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
  } catch (err) { return {}; }
}

const env = loadEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function findOrphans() {
  console.log("--- 🕵️ Orphaned Shop Audit ---");

  // 1. Get all shops
  const { data: shops } = await supabase.from('shops').select('id, name');
  
  // 2. Get item counts
  const { data: items } = await supabase.from('menu_items').select('shop_id');
  const shopItemCounts = {};
  items?.forEach(i => shopItemCounts[i.shop_id] = (shopItemCounts[i.shop_id] || 0) + 1);

  // 3. Find orphans (0 items)
  const orphans = shops?.filter(s => !shopItemCounts[s.id]);
  console.log(`Found ${orphans?.length || 0} orphaned shops (0 items).\n`);

  for (const orphan of orphans || []) {
    // 4. Find the owner email in shop_users
    const { data: owner } = await supabase.from('shop_users').select('email').eq('shop_id', orphan.id).single();
    console.log(`- Shop: ${orphan.name} (${orphan.id})`);
    console.log(`  Owner Email: ${owner?.email || 'N/A'}`);
  }
}

findOrphans();
