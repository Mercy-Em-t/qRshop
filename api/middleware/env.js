/* global process */
import { createClient } from '@supabase/supabase-js';

export function getEnv(name, aliases = []) {
  const keys = [name, ...aliases];
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

export function requireEnv(name, aliases = []) {
  const value = getEnv(name, aliases);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function createSupabaseAdminClient() {
  const url = requireEnv('SUPABASE_URL', ['VITE_SUPABASE_URL']);
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, serviceRoleKey);
}
