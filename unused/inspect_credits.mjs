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

const supabaseUrl = env['VITE_SUPABASE_URL'] || env['SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'] || env['SUPABASE_ANON_KEY'] || env['SUPABASE_SERVICE_ROLE_KEY']; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log("Supabase URL:", supabaseUrl);
  
  // 1. Inspect shops
  const { data: shops, error } = await supabase.from('shops').select('shop_id, name, ai_credits');
  if (error) {
    console.error("Error fetching shops:", error);
    return;
  }
  
  console.log("\n--- Active Shops in Database ---");
  shops.forEach(s => {
    console.log(`ID: ${s.shop_id} | Name: ${s.name} | Credits: ${s.ai_credits}`);
  });
}

inspect();
