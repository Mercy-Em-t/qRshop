import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkColumns() {
  const { data, error } = await supabase
    .from('shops')
    .select('*')
    .limit(1);

  if (data && data.length > 0) {
    console.log("Shops Columns:", Object.keys(data[0]));
  } else {
    console.log("No shops found or query failed.");
  }
}

checkColumns();
