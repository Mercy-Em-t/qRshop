import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error: 'Method Not Allowed'});

  try {
    const { Body } = req.body;
    
    const callbackData = Body.stkCallback;
    const resultCode = callbackData.ResultCode; // 0 is success
    const resultDesc = callbackData.ResultDesc;

    console.log("M-Pesa Callback Ping:", JSON.stringify(callbackData));

    // Order tracking injection extracted from webhook URL
    const orderId = req.query.orderId;

    if (!orderId) {
      // Must return 200 HTTP otherwise Daraja spam retries your endpoint 10x per failed order
      return res.status(200).json({ message: "Acknowledged ping but missing order anchor" });
    }

    // Spin up internal core db connection using Service Role privileges 
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    
    if(!supabaseUrl || !supabaseKey) {
       console.error("Missing DB context on the Callback Router.");
       return res.status(200).json({ message: "No db credentials, payload dropped" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse transaction status
    // If resultCode === 0 exactly, payment is cleanly authorized by user
    // Any other number is a cancellation, timeout, or insufficient funds
    const newStatus = resultCode === 0 ? "paid" : "rejected"; 

    // Directly alter the targeted state inside the live table allowing frontend listeners to automatically pivot clients
    await supabase.from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    res.status(200).json({ message: "Webhook accepted and processed securely" });
  } catch (err) {
    console.error("Fatal Callback Flow Exeception:", err);
    res.status(500).json({ error: err.message });
  }
}
