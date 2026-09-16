import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _supabaseAdmin: SupabaseClient | null = null;
let _supabaseBrowser: SupabaseClient | null = null;

/**
 * Supabase admin client (service role) — for server-side use only.
 * Lazy-initialized to avoid build-time errors when env vars aren't set.
 * Never expose this client or its key to the browser.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const rawUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
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

/**
 * Supabase public client (anon key) — safe for browser and client-side components.
 */
const DEFAULT_SUPABASE_URL = "https://epxhppjhivpwljpjpznm.supabase.co";
const DEFAULT_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVweGhwcGpoaXZwd2xqcGpwem5tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0OTcyMDksImV4cCI6MjEwNTA3MzIwOX0.xsxI2xOlmYk1kO1GqRHTUH4HUWd_VwhM2TZ8811JVfE";

export function getSupabaseClient(): SupabaseClient {
  if (!_supabaseBrowser) {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;
    const url = rawUrl.trim().replace(/\/+$/, "");
    _supabaseBrowser = createClient(url, key);
  }
  return _supabaseBrowser;
}

