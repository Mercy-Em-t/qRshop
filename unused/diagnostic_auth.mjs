import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function check() {
  const { data: users, error } = await supabase
    .from('shop_users')
    .select('*')
    .eq('email', 'mamarosy@shopqr.ke');

  console.log("Shop Users Query Result:", JSON.stringify(users, null, 2));
  if (error) console.error("Error:", error);
}

check();
