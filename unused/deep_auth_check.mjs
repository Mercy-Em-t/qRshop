import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function deepCheck() {
  console.log("--- Supabase Auth Diagnostics ---");
  
  // 1. Check auth.users (Internal)
  const { data: { users }, error: authErr } = await supabase.auth.admin.listUsers();
  const mamarosyAuth = users.find(u => u.email === 'mamarosy@shopqr.ke');
  
  if (!mamarosyAuth) {
    console.log("❌ User NOT FOUND in auth.users");
  } else {
    console.log("✅ Found in auth.users. ID:", mamarosyAuth.id);
  }

  // 2. Check public.shop_users
  const { data: profiles, error: profErr } = await supabase
    .from('shop_users')
    .select('*')
    .eq('email', 'mamarosy@shopqr.ke');

  if (profiles && profiles.length > 0) {
    console.log("✅ Found in shop_users. ID:", profiles[0].id);
    if (mamarosyAuth && mamarosyAuth.id !== profiles[0].id) {
       console.log("🚨 ID MISMATCH! Auth ID does not match Profile ID.");
    } else if (mamarosyAuth) {
       console.log("🎉 IDs MATCH perfectly.");
    }
  } else {
    console.log("❌ User NOT FOUND in shop_users");
  }
}

deepCheck();
