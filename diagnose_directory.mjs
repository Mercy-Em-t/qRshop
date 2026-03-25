import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
   const [key, ...val] = line.split('=');
   if (key && val) env[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
});

const supabase = createClient(env['VITE_SUPABASE_URL'], env['VITE_SUPABASE_ANON_KEY']);

async function diagnose() {
  console.log("=== 1. Counting all shops ===");
  const { data: allShops, error: e1 } = await supabase.from('shops').select('id, name, is_online, list_in_global_marketplace');
  if (e1) console.error("Shops error (RLS?):", e1.message);
  else console.log(`Total shops visible: ${allShops?.length}`);

  console.log("\n=== 2. Shops with is_online=true ===");
  const { data: onlineShops } = await supabase.from('shops').select('id, name').eq('is_online', true);
  console.log(`Online shops: ${onlineShops?.length}`);

  console.log("\n=== 3. Shops with list_in_global_marketplace=true ===");
  const { data: mktShops } = await supabase.from('shops').select('id, name').eq('list_in_global_marketplace', true);
  console.log(`Marketplace shops: ${mktShops?.length}`);

  console.log("\n=== 4. Products with joined shop filter ===");
  const { data: prods, error: e4 } = await supabase
    .from('menu_items')
    .select('id, name, shop_id, shops!inner(id, name, is_online, list_in_global_marketplace)')
    .eq('shops.is_online', true)
    .eq('shops.list_in_global_marketplace', true)
    .limit(5);
  if (e4) console.error("Products join error:", e4.message);
  else console.log(`Products returned with joined filter: ${prods?.length}`);

  console.log("\n=== 5. Products without filters (raw) ===");
  const { data: rawProds, error: e5 } = await supabase.from('menu_items').select('id, name').limit(5);
  if (e5) console.error("Raw products error (RLS?):", e5.message);
  else console.log(`Raw products visible: ${rawProds?.length}`, rawProds?.map(p => p.name));
}

diagnose();
