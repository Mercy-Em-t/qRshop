import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

serve(async (req) => {
  // Restrict access securely via Vercel Cron Secret or Supabase Header
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  const cronSecret = Deno.env.get("CRON_SECRET");

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized. Invalid Cron Secret." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: "Missing Environment Hooks" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Use service role to bypass RLS and see across all shops globally
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Gather Global Metrics
    const { count: shopCount, error: shopErr } = await supabase
      .from('shops')
      .select('*', { count: 'exact', head: true });
      
    const { data: orders, error: orderErr } = await supabase
      .from('orders')
      .select('total_price, status')
      .not('status', 'in', '("pending", "rejected", "cancelled")')
      .limit(999999);

    if (shopErr) throw shopErr;
    if (orderErr) throw orderErr;

    let totalGmv = 0;
    const totalOrders = orders ? orders.length : 0;

    if (orders) {
      orders.forEach(o => {
        totalGmv += o.total_price || 0;
      });
    }

    const snapshot = {
      total_shops: shopCount || 0,
      total_orders: totalOrders,
      total_gmv: totalGmv,
      report_date: new Date().toISOString()
    };

    // 2. Commit Snapshot to Telemetry Stream
    const { error: insertErr } = await supabase.from('events').insert({
      event_type: 'system_weekly_report',
      metadata: snapshot
    });

    if (insertErr) throw insertErr;

    return new Response(JSON.stringify({ success: true, snapshot }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Cron Aggregation Failed:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
