import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
   const [key, ...val] = line.split('=');
   if (key && val) env[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
});

const SUPABASE_URL = env['VITE_SUPABASE_URL'];
const SUPABASE_KEY = env['VITE_SUPABASE_ANON_KEY'];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
  const { data, error } = await supabase.from('shops').select('*').limit(1);
  if (error) console.error("Error:", error);
  else {
      if (data && data.length > 0) {
          console.log(Object.keys(data[0]));
      } else {
          console.log("No shops found, but query succeeded.");
      }
  }
}
check();
