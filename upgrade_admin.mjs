import { createClient } from "@supabase/supabase-js";
import fs from 'fs';
import path from 'path';

// Manual .env.local loader
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
  } catch (err) {
    console.error("Failed to read .env.local:", err.message);
    return {};
  }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY; 

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ ERROR: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function upgradeAdmin() {
  const oldEmail = 'admin@qrshop.com';
  const newEmail = 'admin@tmsavannah.com';

  console.log(`--- 🚀 Upgrading Admin: ${oldEmail} -> ${newEmail} ---`);

  // 1. Find the user in Auth
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  const user = users?.find(u => u.email === oldEmail);

  if (!user) {
    console.log("❌ Admin user not found in Auth. Checking if already upgraded...");
    const upgraded = users?.find(u => u.email === newEmail);
    if (upgraded) {
      console.log("✅ Admin already upgraded.");
    } else {
      console.error("❌ Could not find admin user to upgrade.");
    }
    return;
  }

  // 2. Update Auth Email
  const { error: authError } = await supabase.auth.admin.updateUserById(user.id, {
    email: newEmail
  });

  if (authError) {
    console.error("❌ Auth Update Error:", authError.message);
    return;
  }

  // 3. Update public.shop_users
  const { error: syncError } = await supabase
    .from('shop_users')
    .update({ email: newEmail })
    .eq('id', user.id);

  if (syncError) {
    console.error("❌ DB Sync Error:", syncError.message);
  } else {
    console.log("✅ Admin Email Successfully Upgraded.");
  }
}

upgradeAdmin();
