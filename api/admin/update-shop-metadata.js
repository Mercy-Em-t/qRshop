import { validateAdminRequest, sanitizeSlug } from '../middleware/security.js';

export default async function handler(req, res) {
  const security = await validateAdminRequest(req, res);
  if (!security) return; 

  const { adminDb } = security;

  try {
    const { 
      shopId, 
      name, 
      subdomain, 
      phone, 
      isSuspended, 
      suspensionReason,
      plan
    } = req.body;

    if (!shopId) {
       return res.status(400).json({ error: "Missing critical parameters (Shop ID)." });
    }

    // 1. Prepare Update Payload
    const updatePayload = {};
    if (name) updatePayload.name = name.trim();
    if (phone) updatePayload.phone = phone.trim();
    
    if (typeof isSuspended === 'boolean') {
       updatePayload.is_suspended = isSuspended;
       updatePayload.suspension_reason = suspensionReason || (isSuspended ? "Service temporarily unavailable." : "");
    }

    // Tier-Based Logic for Plan and Subdomain
    if (plan) {
       const lowerPlan = plan.toLowerCase();
       const allowedPlans = ['free', 'basic', 'pro', 'business'];
       if (allowedPlans.includes(lowerPlan)) {
          updatePayload.plan = lowerPlan;
          updatePayload.subscription_expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
       }
    }

    // 2. Enforce Subdomain Tiering
    if (subdomain !== undefined) {
       const cleanSub = sanitizeSlug(subdomain);
       const targetPlan = (plan || "unknown").toLowerCase();
       
       let effectivePlan = targetPlan;
       if (targetPlan === "unknown") {
          const { data: currentShop } = await adminDb.from('shops').select('plan').eq('id', shopId).single();
          effectivePlan = currentShop?.plan?.toLowerCase() || 'free';
       }

       const canHaveSubdomain = ['pro', 'business', 'enterprise'].includes(effectivePlan);
       
       if (canHaveSubdomain) {
          updatePayload.subdomain = cleanSub;
       } else {
          updatePayload.subdomain = null; 
       }
    }

    // 3. Perform Update
    const { data: shop, error: updateErr } = await adminDb
      .from('shops')
      .update(updatePayload)
      .eq('id', shopId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    return res.status(200).json({ 
      success: true, 
      message: `Shop metadata updated. Subdomain ${updatePayload.subdomain ? 'set' : 'restricted for this tier'}.`, 
      shop 
    });
  } catch (err) {
    console.error("Update Shop Metadata Fail:", err);
    res.status(500).json({ error: err.message });
  }
}
