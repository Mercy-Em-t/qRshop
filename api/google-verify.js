import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Dynamic Google site verification handler.
 *
 * Serves the correct google-site-verification token for any shop on this platform.
 * Google visits:  /s/{shop-slug}/google{token}.html
 * Vercel rewrites that to: /api/google-verify.js?shop={shop-slug}
 *
 * The token is stored per-shop in shops.google_verification_token.
 * No per-merchant code changes needed — one handler serves all shops.
 */
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

  const shopIdentifier = req.query.shop || req.query.id;

  // If no shop identifier — serve the platform-level token (for Mamarosy / root domain)
  if (!shopIdentifier) {
    return res.status(200).send('google-site-verification: google0b2f7a0b0c00df60.html');
  }

  try {
    // Look up the shop's verification token by slug or shop_id
    const { data: shop, error } = await supabase
      .from('shops')
      .select('google_verification_token, name')
      .or(`slug.eq.${shopIdentifier},shop_id.eq.${shopIdentifier}`)
      .maybeSingle();

    if (error) throw error;

    if (!shop || !shop.google_verification_token) {
      // Token not yet set — return 404 so Google knows verification isn't ready
      return res.status(404).send('<html><body>Verification token not configured for this shop.</body></html>');
    }

    // Serve the token in the exact format Google expects
    const token = shop.google_verification_token.trim();
    return res.status(200).send(`google-site-verification: ${token}`);

  } catch (err) {
    console.error('google-verify error:', err);
    return res.status(500).send('Internal error');
  }
}
