import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

let envFile;
try {
  envFile = fs.readFileSync('.env.local', 'utf-8');
} catch {
  envFile = fs.readFileSync('.env', 'utf-8');
}
const env = {};
envFile.split('\n').forEach(line => {
   const [key, ...val] = line.split('=');
   if (key && val.length > 0) env[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
});

// Use service role to bypass RLS!
const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseKey = env['SUPABASE_SERVICE_ROLE_KEY']; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Checking for items...");
  // Use service role, should see all items
  const { data: items, error: fetchErr } = await supabase
    .from('menu_items')
    .select('shop_id, id, price, name')
    .limit(1);
    
  if (fetchErr) {
     console.error("Error fetching items:", fetchErr);
     return;
  }
  
  if (!items || items.length === 0) {
     console.log("Database literally has no items. I will create a test shop and item!");
     const shopId = '22222222-2222-2222-2222-222222222222';
     await supabase.from('shops').upsert({ id: shopId, name: 'Debug Shop', phone: '123' });
     const { data: newItem } = await supabase.from('menu_items').insert({
         shop_id: shopId, name: 'Debug Item', price: 100, category: 'Test'
     }).select().single();
     items.push(newItem);
  }
  
  const shopId = items[0].shop_id;
  console.log(`Using Shop ID: ${shopId} | Item: ${items[0].name}`);
  
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
    order_type: "direct", // Trying direct!
    items: [{ id: items[0].id, quantity: 1 }]
  };
  
  console.log("Executing RPC checkout_cart with 'direct'...");
  let res = await supabase.rpc('checkout_cart', { payload });
  if (res.error) console.error("RPC ERROR ('direct'):", res.error);
  else console.log("✅ SUCCESS 'direct':", res.data);

  payload.order_type = "whatsapp";
  console.log("\nExecuting RPC checkout_cart with 'whatsapp'...");
  res = await supabase.rpc('checkout_cart', { payload });
  if (res.error) console.error("RPC ERROR ('whatsapp'):", res.error);
  else console.log("✅ SUCCESS 'whatsapp':", res.data);
  
  payload.order_type = "delivery";
  console.log("\nExecuting RPC checkout_cart with 'delivery'...");
  res = await supabase.rpc('checkout_cart', { payload });
  if (res.error) console.error("RPC ERROR ('delivery'):", res.error);
  else console.log("✅ SUCCESS 'delivery':", res.data);
}

test();
