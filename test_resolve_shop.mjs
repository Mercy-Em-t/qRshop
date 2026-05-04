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

export async function resolveShopIdentifier(identifier) {
  if (!supabase) return null;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(identifier);

  let query = supabase.from("shops").select("*, id:shop_id");
  
  if (isUUID) {
    query = query.or(`shop_id.eq.${identifier},slug.eq.${identifier},subdomain.eq.${identifier},slug_history.cs.{${identifier}}`);
  } else {
    query = query.or(`slug.eq.${identifier},subdomain.eq.${identifier},slug_history.cs.{${identifier}}`);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("Error resolving shop identifier:", error);
    return null;
  }

  return data;
}

async function run() {
  const shopId = 'deada001-1111-4444-8888-deada0016666';
  const shop = await resolveShopIdentifier(shopId);
  console.log("Resolved shop:", shop);
}

run();
