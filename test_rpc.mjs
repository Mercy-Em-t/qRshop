import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ocsuqfabqsyrbsewcaez.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  throw new Error('Missing SUPABASE_ANON_KEY environment variable');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testRpc() {
   console.log("Testing checkout_cart...");
   
   const payload = {
      shop_id: 'aee518e3-0c46-44b2-a4ed-2bc38645fb8f',
      table_id: null,
      total_price: 1500,
      discount_amount: 0,
      coupon_code: null,
      client_name: 'Test',
      client_phone: '+254700000000',
      parent_order_id: null,
      fulfillment_type: 'pickup',
      delivery_address: null,
      delivery_fee_charged: 0,
      items: [{ id: 'fake-uuid-1', quantity: 1 }]
   };
   
   const { data, error } = await supabase.rpc('checkout_cart', { payload });
   console.log("Raw RPC Response Data:", data);
   console.log("Raw RPC Response Error:", JSON.stringify(error, null, 2));
}

testRpc();
