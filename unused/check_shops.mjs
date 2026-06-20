import { createClient } from "@supabase/supabase-js";
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.resolve('.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) env[parts[0].trim()] = parts.slice(1).join('=').trim();
  });
  return env;
}

const env = loadEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkShops() {
  const { data, error } = await supabase
    .from('shops')
    .select('id, name, needs_password_change, kyc_completed, plan');
  
  if (error) {
    console.error(error);
    return;
  }

  console.log("Total Shops:", data.length);
  const tampered = data.filter(s => s.needs_password_change || !s.kyc_completed);
  console.log("Suspicious Shops:", tampered.length);
  tampered.forEach(s => {
    console.log(`- ${s.name} (ID: ${s.id}): needs_pwd=${s.needs_password_change}, kyc=${s.kyc_completed}, plan=${s.plan}`);
  });
}

checkShops();
