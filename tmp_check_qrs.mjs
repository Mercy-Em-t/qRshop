import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ocsuqfabqsyrbsewcaez.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jc3VxZmFicXN5cmJzZXdjYWV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1MjI4MjAsImV4cCI6MjA4OTA5ODgyMH0.ZxDwD3TIYg9dL2pvJPaTInLmlQu95Xv7BVB_PAezt9Q";
const supabase = createClient(supabaseUrl, anonKey);

async function check() {
  console.log("Checking qrs table schema...");
  const { data, error } = await supabase.from('qrs').select('*').limit(1);
  if (error) {
    console.error("Error fetching from qrs:", error.message);
  } else {
    console.log("Record found:", data[0]);
    console.log("Columns:", Object.keys(data[0] || {}));
  }

  console.log("\nAttempting to insert a short-id record...");
  const testId = "TEST" + Math.floor(Math.random() * 1000);
  const { error: insertError } = await supabase.from('qrs').insert([
    { id: testId, shop_id: '11111111-1111-1111-1111-111111111111', location: 'Test Room', action: 'open_menu' }
  ]);
  
  if (insertError) {
    console.log("Insert with 'id' failed:", insertError.message);
    
    const { error: insertErrorQrId } = await supabase.from('qrs').insert([
      { qr_id: testId, shop_id: '11111111-1111-1111-1111-111111111111', location: 'Test Room', action: 'open_menu' }
    ]);
    if (insertErrorQrId) {
       console.log("Insert with 'qr_id' failed:", insertErrorQrId.message);
    } else {
       console.log("Insert with 'qr_id' (TEXT) succeeded!");
    }
  } else {
    console.log("Insert with 'id' (TEXT) succeeded!");
  }
}

check();
