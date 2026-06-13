import { createClient } from "@supabase/supabase-js";

// Server-side client using the service role key. Never expose this key to
// the browser — it bypasses row-level security. All routes that use this
// live under app/api/** (server-only).
export function supabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
