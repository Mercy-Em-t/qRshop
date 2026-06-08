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

async function inspectOrdersTable() {
  // 1. Fetch 1 row from orders to see its fields
  const { data, error } = await supabase.from('orders').select('*').limit(1);
  if (error) {
    console.error("Error fetching order row:", error);
    return;
  }
  
  console.log("\n--- Fields in an Orders record ---");
  if (data && data.length > 0) {
    console.log(Object.keys(data[0]));
    console.log("\nSample record:", data[0]);
  } else {
    console.log("No orders found in the database to inspect fields.");
  }
}

inspectOrdersTable();
