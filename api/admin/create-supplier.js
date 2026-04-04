import { validateAdminRequest } from '../middleware/security';

export default async function handler(req, res) {
  const security = await validateAdminRequest(req, res);
  if (!security) return; 

  const { adminDb, caller } = security;

  try {
    const { name, industry, phone, email, mpesaShortcode, mpesaPasskey } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Missing Supplier Name or Email." });
    }

    const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let tempPassword = "";
    for (let i = 0; i < 8; i++) {
        tempPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    const { data: userData, error: createErr } = await adminDb.auth.admin.createUser({
       email: email.trim().toLowerCase(),
       password: tempPassword,
       email_confirm: true
    });

    if (createErr) throw new Error(`Auth Generation Failed: ${createErr.message}`);

    const { data: supplier, error: supErr } = await adminDb
      .from('suppliers')
      .insert([{ 
        id: userData.user.id,
        name: name.trim(), 
        industry: industry || 'retail', 
        contact_phone: phone?.trim(),
        email: email.trim().toLowerCase(),
        mpesa_shortcode: mpesaShortcode?.trim(),
        mpesa_passkey: mpesaPasskey?.trim()
      }])
      .select()
      .single();

    if (supErr) throw supErr;

    return res.status(200).json({ 
      success: true, 
      message: "Wholesaler provisioned successfully. Burst protection active.",
      supplier,
      tempPassword
    });
  } catch (err) {
    console.error("Create Supplier Fail:", err);
    res.status(500).json({ error: err.message });
  }
}
