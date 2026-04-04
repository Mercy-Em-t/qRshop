import { validateAdminRequest } from '../middleware/security.js';

export default async function handler(req, res) {
  const security = await validateAdminRequest(req, res);
  if (!security) return; 

  const { adminDb, caller } = security;

  try {
    const { kycId, approved } = req.body;

    if (!kycId) {
      return res.status(400).json({ error: "Missing KYC ID." });
    }

    const { data: kyc, error: kycErr } = await adminDb
      .from('shop_kyc')
      .update({ 
        verification_status: approved ? 'approved' : 'rejected',
        verified_at: new Date().toISOString()
      })
      .eq('id', kycId)
      .select()
      .single();

    if (kycErr) throw kycErr;

    return res.status(200).json({ 
      success: true, 
      message: `KYC ${approved ? 'approved' : 'rejected'} successfully. Burst protection active.`,
      kyc 
    });
  } catch (err) {
    console.error("Process KYC Fail:", err);
    res.status(500).json({ error: err.message });
  }
}
