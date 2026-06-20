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
// IMPORTANT: This script requires the SERVICE_ROLE_KEY to manage users
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY; 

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ ERROR: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env.local");
  console.log("Please add 'SUPABASE_SERVICE_ROLE_KEY=your_key_here' to .env.local before running.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const accounts = [
  { email: 'memurugat@gmail.com', password: 'TemporaryPassword123!', role: 'system_admin' }
];

async function provision() {
  console.log("--- 🚀 Provisioning Native Auth Accounts 🚀 ---");

  for (const account of accounts) {
    console.log(`\nChecking account: ${account.email}...`);
    
    // 1. Check if user already exists in Auth
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error("❌ Failed to list users:", listError.message);
      continue;
    }

    let existingUser = users.find(u => u.email === account.email);
    let userId;

    if (existingUser) {
      console.log(`✅ User already exists in Auth (UID: ${existingUser.id})`);
      userId = existingUser.id;
    } else {
      console.log(`Creating user in Auth...`);
      const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true
      });

      if (createError) {
        console.error("❌ Failed to create user:", createError.message);
        continue;
      }
      console.log(`✅ Created user (UID: ${user.id})`);
      userId = user.id;
    }

    // 2. Sync with public.shop_users table
    console.log(`Syncing with public.shop_users...`);
    const { error: syncError } = await supabase
      .from('shop_users')
      .upsert({
        id: userId,
        email: account.email,
        role: account.role
      }, { onConflict: 'email' });

    // 3. Trigger Password Reset (To force the admin to set a real password on first login)
    console.log(`Triggering password reset for security...`);
    const { error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: account.email
    });

    if (resetError) {
      console.error("❌ Reset Trigger Failed:", resetError.message);
    } else {
      console.log(`✅ Success: Reset instructions sent to ${account.email}`);
    }
  }

  console.log("\n--- Production Provisioning Complete ---");
  console.log("Next: Ensure your Site URL and Redirect URIs in Supabase Auth settings point to your REAL Vercel URL, not localhost.");
}

provision();
