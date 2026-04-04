import { createClient } from '@supabase/supabase-js';

/**
 * System B -> System A Webhook Receiver
 * Endpoint: POST /api/order/status
 * Purpose: Receive order status updates from the processing backend.
 */
export default async function handler(req, res) {
  // 1. Security Check: System B should provide the API key
  const apiKey = req.headers['x-api-key'];
  const expectedApiKey = process.env.SYSTEM_B_INCOMING_API_KEY;

  if (expectedApiKey && apiKey !== expectedApiKey) {
    return res.status(401).json({ error: "Unauthorized: Invalid API Key from System B." });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { order_id, status, timestamp, tracking_id, reason } = req.body;

    if (!order_id || !status) {
      return res.status(400).json({ error: "Missing order_id or status in payload." });
    }

    // 2. Database Connection
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 3. Update Order Status in System A
    // System B is the official authority on payment (paid) and tracking.
    const statusMap = {
      'paid': 'paid',
      'confirmed': 'processing',
      'shipped': 'shipped',
      'delivered': 'completed',
      'failed': 'failed',
      'cancelled': 'archived'
    };

    const mappedStatus = statusMap[status] || 'pending';

    const { data, error } = await supabase
      .from('orders')
      .update({ 
        system_b_status: status, 
        system_b_tracking_id: tracking_id || null,
        system_b_updated_at: timestamp || new Date().toISOString(),
        status: mappedStatus
      })
      .eq('id', order_id)
      .select()
      .single();

    if (error) {
      console.error("DB Update Error from System B Webhook:", error);
      return res.status(500).json({ error: "Database Synchronization Failed." });
    }

    console.log(`System B Status Update: Order ${order_id} is now ${status}.`);

    return res.status(200).json({ 
      success: true, 
      message: "Order status synchronized successfully.",
      updated_order: data 
    });
  } catch (err) {
    console.error("Fatal Webhook Error:", err);
    res.status(500).json({ error: err.message });
  }
}
