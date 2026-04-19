import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkEventCols() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .limit(1);

  if (data && data.length > 0) {
    console.log("Events Columns:", Object.keys(data[0]));
  } else {
    console.log("No events found or query failed.");
    // Try to get columns from pg_attribute if we can
  }
}

checkEventCols();
