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

async function linkAndReset() {
  const mappings = [
    { email: '23@23.com', shop_id: 'b25c1667-5d63-4cfc-91e7-b8fe203e12c3', shop_name: 'CyberSavannah' },
    { email: '24@24.com', shop_id: 'b1f7923f-7e6f-41a4-93e5-24c4df8b5ab8', shop_name: 'Savannah Threads' }
  ];

  console.log("--- 🔗 Linking & Resetting Orphaned Shops ---");

  for (const m of mappings) {
    console.log(`\nProcessing ${m.email} for ${m.shop_name}...`);

    // 1. Find user in Auth
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users?.find(u => u.email === m.email);

    if (!user) {
      console.error(`❌ User ${m.email} not found in Auth.`);
      continue;
    }

    // 2. Set Password to shop123
    const { error: resetError } = await supabase.auth.admin.updateUserById(user.id, {
      password: 'shop123'
    });
    if (resetError) console.error(`❌ Password Reset Error: ${resetError.message}`);
    else console.log(`✅ Password reset to 'shop123'.`);

    // 3. Update shop_users table to link correct shop_id
    const { error: linkError } = await supabase
      .from('shop_users')
      .update({ shop_id: m.shop_id })
      .eq('id', user.id);
    
    if (linkError) console.error(`❌ Linkage Error: ${linkError.message}`);
    else console.log(`✅ Linked to Shop ID: ${m.shop_id}`);
  }

  console.log("\n--- Recovery Complete ---");
}

linkAndReset();
