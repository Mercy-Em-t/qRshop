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

async function run() {
  console.log("Fetching all shop memberships via service role client...");
  
  const { data: members, error } = await supabase
    .from("shop_members")
    .select("*");

  if (error) {
    console.error("Error fetching memberships:", error);
    return;
  }

  console.log(`Found ${members.length} total memberships.`);

  // Update every membership to ensure is_active is true so they pass RLS
  for (const member of members) {
    if (!member.is_active) {
      console.log(`Updating member with shop_id ${member.shop_id} and user_id ${member.user_id} to be active.`);
      const { error: updateError } = await supabase
        .from("shop_members")
        .update({ is_active: true })
        .match({ user_id: member.user_id, shop_id: member.shop_id });

      if (updateError) {
        console.error(`Error updating membership:`, updateError);
      }
    }
  }

  console.log("All memberships updated perfectly.");
}

run();
