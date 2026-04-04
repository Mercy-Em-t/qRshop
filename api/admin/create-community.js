import { validateAdminRequest, sanitizeSlug } from '../middleware/security.js';

export default async function handler(req, res) {
  const security = await validateAdminRequest(req, res);
  if (!security) return; 

  const { adminDb, caller } = security;

  try {
    const { name, slug, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Missing Community Name." });
    }

    const cleanSlug = sanitizeSlug(slug) || sanitizeSlug(name);

    const { data: community, error: commErr } = await adminDb
      .from('communities')
      .insert([{ 
        name: name.trim(), 
        slug: cleanSlug, 
        description: description?.trim() 
      }])
      .select()
      .single();

    if (commErr) throw commErr;

    return res.status(200).json({ 
      success: true, 
      message: "Community sprouted successfully. Burst protection active.",
      community 
    });
  } catch (err) {
    console.error("Create Community Fail:", err);
    res.status(500).json({ error: err.message });
  }
}
