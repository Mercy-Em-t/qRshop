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
  const shopId = 'deada001-1111-4444-8888-deada0016666';
  const { data, error } = await supabase
    .from("menu_items")
    .select("*, product_images(url, position)")
    .eq("shop_id", shopId)
    .neq("is_active", false)
    .order("category", { ascending: true });

  if (error) {
     console.error("Fetch items error:", error);
  } else {
     console.log(`Success! Found ${data.length} menu items.`);
  }
}

check();
