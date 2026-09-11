import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabaseAdmin: SupabaseClient | null = null;

/**
 * Supabase admin client (service role) — for server-side use only.
 * Lazy-initialized to avoid build-time errors when env vars aren't set.
 * Never expose this client or its key to the browser.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const rawUrl = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!rawUrl) throw new Error("SUPABASE_URL environment variable is not set");
    if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is not set");
    const url = rawUrl.trim().replace(/\/+$/, "");
    _supabaseAdmin = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return _supabaseAdmin;
}
