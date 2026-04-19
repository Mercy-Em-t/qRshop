import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkPolicies() {
  const { data, error } = await supabase.rpc('get_policies'); // If custom RPC exists
  // Alternative: query pg_policies
  const { data: policies, error: polErr } = await supabase.from('pg_policies').select('*').eq('tablename', 'shop_users');
  
  if (polErr) {
    console.error("Standard query failed, trying raw SQL via RPC if exists...");
    // Often we don't have direct access to pg_policies via anon/service unless exposed.
  }
  
  console.log("Policies:", JSON.stringify(policies, null, 2));
}

checkPolicies();
