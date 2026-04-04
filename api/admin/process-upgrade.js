import { validateAdminRequest } from '../middleware/security.js';

export default async function handler(req, res) {
  const security = await validateAdminRequest(req, res);
  if (!security) return; 

  const { adminDb, caller } = security;

  try {
    const { requestId, shopId, approved } = req.body;

    if (!requestId || !shopId) {
      return res.status(400).json({ error: "Missing Request ID or Shop ID." });
    }

    const { data: request, error: reqErr } = await adminDb
      .from('upgrade_requests')
      .update({ status: approved ? 'approved' : 'rejected' })
      .eq('id', requestId)
      .select()
      .single();

    if (reqErr) throw reqErr;

    if (approved) {
      // Apply the plan and a 30-day subscription period
      const { error: shopErr } = await adminDb
        .from('shops')
        .update({ 
           plan: request.requested_tier,
           subscription_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', shopId);
      
      if (shopErr) throw shopErr;
    }

    return res.status(200).json({ 
      success: true, 
      message: `Upgrade request ${approved ? 'approved' : 'rejected'}. Shop leveled up. Burst protection active.`
    });
  } catch (err) {
    console.error("Process Upgrade Fail:", err);
    res.status(500).json({ error: err.message });
  }
}
