import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let envFile;
try {
  envFile = fs.readFileSync('.env.local', 'utf-8');
} catch {
  envFile = fs.readFileSync('.env', 'utf-8');
}
const env = {};
envFile.split('\n').forEach(line => {
   const [key, ...val] = line.split('=');
   if (key && val.length > 0) env[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY']; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function testPerf() {
  console.log("Measuring query performance...");
  
  const startShop = Date.now();
  const { data: shops, error: e1 } = await supabase.from('shops').select('*').limit(1);
  console.log(`Shops query took: ${Date.now() - startShop}ms`, e1 || "");
  
  if (shops && shops.length > 0) {
      const shopId = shops[0].id;
      const startMenu = Date.now();
      const { data: menuItems, error: e2 } = await supabase.from('menu_items').select('*').eq('shop_id', shopId);
      console.log(`Menu Items query took: ${Date.now() - startMenu}ms for ${menuItems?.length} items`, e2 || "");
  }

  const startPromo = Date.now();
  const { data: promos, error: e3 } = await supabase.from('promotions').select('*').limit(1);
  console.log(`Promotions query took: ${Date.now() - startPromo}ms`, e3 || "");
}

testPerf();
