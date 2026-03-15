import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testShops() {
  console.log("Fetching shops...");
  const { data, error } = await supabase
      .from("shops")
      .select(`
        *,
        shop_users (email, role)
      `)
      .order("created_at", { ascending: false });
      
  if (error) {
    console.error("SELECT ERROR:", error);
  } else {
    console.log("SHOPS DATA:", JSON.stringify(data, null, 2));
  }
}

testShops();
