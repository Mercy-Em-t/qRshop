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
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY']; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrdersSchema() {
  const { data, error } = await supabase.rpc('query_sql', { 
    sql_query: `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'orders';` 
  });
  
  if (error) {
     console.error("query_sql failed:", error);
  } else {
     console.log("\n--- PostgreSQL Schema columns for orders table ---");
     console.log(data);
  }
}

checkOrdersSchema();
