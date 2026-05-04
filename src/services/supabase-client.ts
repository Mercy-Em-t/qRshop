import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string || "").trim().replace(/\r?\n|\r/g, "");
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string || "").trim().replace(/\r?\n|\r/g, "");

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase environment variables are not set. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

export const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        detectSessionInUrl: false,
        lock: null // Disable navigator.locks to prevent cross-tab deadlocks
      }
    })
  : null;
