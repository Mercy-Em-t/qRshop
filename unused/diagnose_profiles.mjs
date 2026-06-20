import { createClient } from "@supabase/supabase-js";
import fs from 'fs';
import path from 'path';

function loadEnv() {
  try {
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
  } catch (err) {
    return {};
  }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function check() {
  // Check users in auth
  const { data: { users }, error: uError } = await supabase.auth.admin.listUsers();
  if (uError) {
     console.error("Auth Error:", uError);
     return;
  }
  
  // Check profiles
  const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
  if (pError) {
     console.error("Profiles Error:", pError);
     return;
  }

  console.log(`Found ${users.length} auth users, ${profiles.length} profiles.`);

  const usersWithoutProfile = users.filter(u => !profiles.some(p => p.id === u.id));
  console.log(`${usersWithoutProfile.length} users don't have a profile:`);
  usersWithoutProfile.forEach(u => {
     console.log(`- ID: ${u.id}, Email: ${u.email}`);
  });

  // Let's also check legacy shop_users
  const { data: shopUsers, error: sError } = await supabase.from('shop_users').select('*');
  if (!sError) {
     console.log(`Found ${shopUsers?.length} shop_users rows.`);
  }
}

check();
