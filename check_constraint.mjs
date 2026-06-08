import { createClient } from "@supabase/supabase-js";
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.resolve('.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      env[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  });
  return env;
}

const env = loadEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  try {
    // Query active RLS policies on public.orders
    const { data: policies, error } = await supabase.rpc('query_sql', {
      sql_query: "SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'orders';"
    });
    if (error) {
      console.log("Error querying policies:", error.message);
    } else {
      console.log("Active Policies on orders table:", policies);
    }
  } catch (err) {
    console.log("Direct RPC query failed:", err.message);
  }
}

check();
