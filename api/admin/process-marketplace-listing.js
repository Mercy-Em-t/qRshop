import { validateAdminRequest } from '../middleware/security.js';

export default async function handler(req, res) {
  const security = await validateAdminRequest(req, res);
  if (!security) return; 

  const { adminDb } = security;

  try {
    const { shopId, status } = req.body;

    if (!shopId || !status) {
      return res.status(400).json({ error: "Missing Shop ID or status." });
    }

    const { data: shop, error: shopErr } = await adminDb
      .from('shops')
      .update({ 
        marketplace_status: status 
      })
      .eq('id', shopId)
      .select()
      .single();

    if (shopErr) throw shopErr;

    return res.status(200).json({ 
      success: true, 
      message: `Marketplace listing set to ${status}. Burst protection active.`,
      shop 
    });
  } catch (err) {
    console.error("Process Marketplace Fail:", err);
    res.status(500).json({ error: err.message });
  }
}
