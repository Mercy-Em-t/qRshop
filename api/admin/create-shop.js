import { validateAdminRequest, sanitizeSlug } from '../middleware/security';

export default async function handler(req, res) {
  const security = await validateAdminRequest(req, res);
  if (!security) return; 

  const { adminDb, caller } = security;

  try {
    const { 
       shopName, 
       subdomain, 
       phone, 
       whatsapp, 
       industry, 
       ownerEmail 
    } = req.body;

    if (!shopName || !ownerEmail) {
       return res.status(400).json({ error: "Missing required provisioning parameters." });
    }

    const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let tempPassword = "";
    for (let i = 0; i < 8; i++) {
        tempPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    const { data: userData, error: createErr } = await adminDb.auth.admin.createUser({
       email: ownerEmail.trim().toLowerCase(),
       password: tempPassword,
       email_confirm: true
    });

    if (createErr) throw new Error(`Auth Generation Failed: ${createErr.message}`);

    const newSystemUser = userData.user;

    // Hardening: Enforce Subdomain Restriction (Pro+ only)
    // Since all new shops start as 'free', we strictly block subdomains at launch
    // to encourage subsequent "Level Up" actions.
    const shopInsertPayload = {
       name: shopName.trim(), 
       subdomain: null, // Strictly NULL for Free Tier launch
       phone: phone?.trim(), 
       whatsapp_number: (whatsapp || phone || "").trim(), 
       plan: "free",
       industry_type: industry,
       needs_password_change: true
    };

    let shopRes, shopErr;
    ({ data: shopRes, error: shopErr } = await adminDb.from('shops').insert([shopInsertPayload]).select().single());
    
    if (shopErr && shopErr.code === '42703') {
       delete shopInsertPayload.subdomain;
       delete shopInsertPayload.whatsapp_number;
       delete shopInsertPayload.industry_type;
       ({ data: shopRes, error: shopErr } = await adminDb.from('shops').insert([shopInsertPayload]).select().single());
    }

    if (shopErr) throw new Error(`Database Isolation Error: ${shopErr.message}`);

    const targetShopId = shopRes.shop_id || shopRes.id;
    const { error: bindingErr } = await adminDb.from('shop_users').insert([{
       id: newSystemUser.id,
       email: ownerEmail.trim().toLowerCase(),
       role: "shop_owner",
       shop_id: targetShopId
    }]);

    if (bindingErr) throw new Error(`Admin Binding Failed: ${bindingErr.message}`);

    return res.status(200).json({ 
       success: true, 
       message: "Sandbox Generated securely. Subdomain restricted to Pro+ tiers.",
       shop: shopRes,
       tempPassword: tempPassword
    });
  } catch (err) {
    console.error("Vercel Admin API Fail:", err);
    res.status(500).json({ error: err.message });
  }
}
