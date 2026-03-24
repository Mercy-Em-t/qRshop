import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
   const [key, ...val] = line.split('=');
   if (key && val) env[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['VITE_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Fetching test shop...");
  const { data: shops } = await supabase.from('shops').select('id').limit(1);
  if (!shops || shops.length === 0) return console.log("No shops found");
  const shopId = shops[0].id;
  
  console.log("Fetching test item...");
  const { data: items } = await supabase.from('menu_items').select('id, price').eq('shop_id', shopId).limit(1);
  if (!items || items.length === 0) return console.log("No items found for shop");
  
  const payload = {
    shop_id: shopId,
    table_id: "Table 1",
    total_price: items[0].price,
    discount_amount: 0,
    coupon_code: null,
    client_name: "Test",
    client_phone: "0700000000",
    parent_order_id: null,
    fulfillment_type: "pickup",
    delivery_address: null,
    delivery_fee_charged: 0,
    items: [{ id: items[0].id, quantity: 1, price: items[0].price }]
  };
  
  console.log("Executing RPC checkout_cart...");

  const { data, error } = await supabase.rpc('checkout_cart', { payload });
  
  if (error) {
     console.error("\nFATAL RPC ERROR DETECTED:");
     console.error(JSON.stringify(error, null, 2));
  } else {
     console.log("\n✅ SUCCESS! Order ID generated:", data);
  }
}

test();
