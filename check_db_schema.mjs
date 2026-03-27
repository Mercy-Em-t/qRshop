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
  } catch (err) {
    return {};
  }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function check() {
  const tables = ['orders', 'supplier_orders', 'communities', 'community_posts'];
  for (const table of tables) {
    console.log(`\n--- Schema for ${table} ---`);
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (!error && data) {
       console.log("Columns:", Object.keys(data[0] || {}));
    } else {
       console.error(`Error checking ${table}:`, error?.message);
    }
  }
}

check();
