import { createClient } from "@supabase/supabase-js";
import fs from 'fs';
import path from 'path';

function loadEnv() {
  try {
    const envPath = path.resolve('.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        env[parts[0].trim()] = parts.slice(1).join('=').trim();
      }
    });
    return env;
  } catch (err) { return {}; }
}

const env = loadEnv();
const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function audit() {
  console.log("--- 🕵️ Admin Audit ---");
  const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers();
  if (authErr) { console.error(authErr); return; }

  console.log("\nAuth Users:");
  users.forEach(u => console.log(`- ${u.email} (${u.id})`));

  const { data: shopUsers, error: dbErr } = await supabase.from('shop_users').select('*');
  if (dbErr) { console.error(dbErr); return; }

  console.log("\nShop Users (DB):");
  shopUsers.forEach(u => console.log(`- ${u.email} | Role: ${u.role} | ID: ${u.id}`));
}

audit();
