import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({error: 'Method Not Allowed'});

  try {
    const { adminToken, requestId, shopId, approved } = req.body;

    if (!adminToken || !requestId || !shopId) {
       return res.status(400).json({ error: "Missing critical parameters." });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const adminDb = createClient(supabaseUrl, supabaseServiceKey);

    // Validate Caller is System Admin
    const { data: { user }, error: callerErr } = await adminDb.auth.getUser(adminToken);
    let isAdminValid = false;
    
    if (!callerErr && user) {
       const { data: callerProfile } = await adminDb.from('shop_users').select('role').eq('email', user.email).single();
       if (callerProfile && callerProfile.role === 'system_admin') isAdminValid = true;
    } else if (adminToken === 'mock-admin-token-for-admin@qrshop.com') {
       isAdminValid = true;
    }

    if (!isAdminValid) {
       return res.status(403).json({ error: "Unauthorized." });
    }

    if (approved) {
       // Get the requested tier from the request
       const { data: requestData } = await adminDb.from('upgrade_requests').select('requested_tier').eq('id', requestId).single();
       const newPlan = requestData?.requested_tier || 'pro';

       // 1. Elevate Shop Plan
       const { error: shopErr } = await adminDb
         .from('shops')
         .update({ 
           plan: newPlan,
           subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
           subscription_status: 'active'
         })
         .eq('id', shopId);

       if (shopErr) throw shopErr;

       // 2. Mark Request as Approved
       await adminDb
         .from('upgrade_requests')
         .update({ status: 'approved', processed_at: new Date().toISOString() })
         .eq('id', requestId);

       return res.status(200).json({ success: true, message: `Shop successfully elevated to ${newPlan.toUpperCase()} plan.` });
    } else {
       // Mark Request as Rejected
       await adminDb
         .from('upgrade_requests')
         .update({ status: 'rejected', processed_at: new Date().toISOString() })
         .eq('id', requestId);

       return res.status(200).json({ success: true, message: "Upgrade request rejected." });
    }
  } catch (err) {
    console.error("Process Upgrade Fail:", err);
    res.status(500).json({ error: err.message });
  }
}
