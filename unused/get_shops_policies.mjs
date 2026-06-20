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

async function checkPolicies() {
  // Try to use a raw query if query_exec exists, else we can't easily fetch pg_policies
  // Since we can't query pg_policies directly via postgrest, we'll just check if query_exec works
  const { data, error } = await supabase.rpc('query_exec', { query: `SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check FROM pg_policies WHERE tablename IN ('shops', 'shop_users');` });
  if (error) {
     console.error("query_exec failed:", error);
  } else {
     console.log(JSON.stringify(data, null, 2));
  }
}

checkPolicies();
