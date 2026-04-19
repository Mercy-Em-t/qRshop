import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testCheckoutRPC() {
  console.log("🧪 Testing checkout_cart RPC with GPS and Account enrichment...");

  const payload = {
    shop_id: "75388c3a-86c4-4b9e-9964-6725bc7ce0b8", // Replace with a valid shop ID for local testing
    table_id: "TEST-AUDIT",
    total_price: 1500,
    client_name: "Audit Tester",
    client_phone: "+254712345678",
    customer_email: "audit@test.com",
    fulfillment_type: "delivery",
    delivery_address: "123 Audit Way, Test City",
    delivery_fee_charged: 150,
    latitude: -1.286389,
    longitude: 36.817223,
    user_id: null, // Test with anonymous first
    items: [
      { id: "e10b6d2e-64d8-4f8e-8a21-99c0e27189f7", quantity: 2 } // Replace with valid menu item id
    ]
  };

  try {
    const { data: orderId, error } = await supabase.rpc('checkout_cart', { payload });

    if (error) {
       console.error("❌ RPC Error:", error.message);
       if (error.details) console.error("Details:", error.details);
    } else {
       console.log("✅ Order Created Successfully! ID:", orderId);
       
       // Verify the content
       const { data: order, error: fetchError } = await supabase
         .from('orders')
         .select('*')
         .eq('id', orderId)
         .single();
         
       if (fetchError) {
         console.error("❌ Verification Fetch Failed:", fetchError.message);
       } else {
         console.log("🔍 Order Verification:");
         console.log(`- Status: ${order.status}`);
         console.log(`- Internal Status: ${order.internal_status}`);
         console.log(`- GPS: ${order.latitude}, ${order.longitude}`);
         console.log(`- Address: ${order.delivery_address}`);
         
         if (order.internal_status === 'CREATED' && order.latitude === -1.286389) {
           console.log("🌟 TEST PASSED: Database persistence logic is sound.");
         } else {
           console.log("⚠️ TEST FAILED: Data mismatch.");
         }
       }
    }
  } catch (err) {
    console.error("💥 Execution Error:", err.message);
  }
}

testCheckoutRPC();
