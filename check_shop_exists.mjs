import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkShop() {
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .eq('id', 'deada001-1111-4444-8888-deada0016666');

  console.log("Shop Check Result:", JSON.stringify(data, null, 2));
  if (error) console.error("Error:", error);
}

checkShop();
