import { createClient } from '@supabase/supabase-js';

const MAX_PAYLOAD_SIZE = 50 * 1024; // 50KB limit to prevent Payload DDoS

// Reserved words that cannot be used as shop subdomains (Platform-Level Security)
const RESERVED_SUBDOMAINS = [
  'admin', 'api', 'auth', 'www', 'mail', 'ftp', 'portal', 
  'billing', 'support', 'assets', 'static', 'dashboard',
  'login', 'signup', 'register', 'status', 'help'
];

/**
 * Validates the incoming admin request for security standards.
 * Includes: 
 * - Content-Type check
 * - Payload Size check
 * - System Admin role verification
 * - Rate Limiting / Cooldown (3 seconds between actions)
 */
export async function validateAdminRequest(req, res) {
  // 1. Method Guard
  if (req.method !== 'POST') {
    res.status(405).json({error: 'Method Not Allowed'});
    return null;
  }

  // 2. Payload Security
  if (req.headers['content-type'] !== 'application/json') {
    res.status(400).json({error: 'Invalid Content-Type. Expected application/json.'});
    return null;
  }

  const contentLength = parseInt(req.headers['content-length'] || '0');
  if (contentLength > MAX_PAYLOAD_SIZE) {
    res.status(413).json({error: 'Payload Too Large. Security threshold exceeded.'});
    return null;
  }

  const { adminToken } = req.body;
  if (!adminToken) {
    res.status(400).json({error: 'Missing Administrative Token.'});
    return null;
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Critical Security Failure: Missing Supabase Service Role Key in environment.");
    res.status(500).json({error: 'Server configuration error.'});
    return null;
  }

  const adminDb = createClient(supabaseUrl, supabaseServiceKey);

  // 3. Admin Authentication & Role Verification
  let caller;
  const { data: { user }, error } = await adminDb.auth.getUser(adminToken);
  if (error || !user) {
    res.status(403).json({error: 'Invalid Admin Token. Security exception logged.'});
    return null;
  }
  const { data: profile } = await adminDb.from('shop_users').select('*').eq('email', user.email).single();
  caller = profile;

  if (!caller || caller.role !== 'system_admin') {
    res.status(403).json({error: 'Forbidden. System Admin role required.'});
    return null;
  }

  // 4. Burst Protection (Rate Limiting)
  const currentTime = new Date();
  const lastCall = new Date(caller.last_api_call_at || 0);
  const diff = (currentTime - lastCall) / 1000;

  if (diff < 3) {
    res.status(429).json({
      error: 'Rate Limit Reached: Burst Protection Active.',
      retryAfter: Math.ceil(3 - diff)
    });
    return null;
  }

  // Update last api call timestamp
  await adminDb.from('shop_users').update({ last_api_call_at: currentTime.toISOString() }).eq('id', caller.id);

  return { adminDb, caller };
}

/**
 * Sanitizes strings for use in slugs or subdomains (Inertia against injection)
 * Also prevents hijacking of Platform Reserved Subdomains.
 */
export function sanitizeSlug(str) {
  if (!str) return null;
  const clean = str.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");
  
  // Security Guard: Prevent platform takeover via reserved keywords
  if (RESERVED_SUBDOMAINS.includes(clean)) {
     console.error(`Security Incident: Attempt to register reserved subdomain detected: ${clean}`);
     return null;
  }
  
  return clean;
}
