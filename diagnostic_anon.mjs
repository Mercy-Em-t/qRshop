import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkAnonFetch() {
  // We can't use auth.uid() in a script easily, but we can check if the table is readable at all for anon
  const { data, error } = await supabase
    .from('shop_users')
    .select('id, email')
    .eq('email', 'mamarosy@shopqr.ke');

  console.log("Anon Fetch Result:", JSON.stringify(data, null, 2));
  if (error) console.error("Anon Fetch Error:", error);
}

checkAnonFetch();
