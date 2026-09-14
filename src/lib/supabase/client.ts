"use client";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";
import type { Database } from "./database.types";

/**
 * A browser client with no session at all.
 *
 * Deliberately not `createBrowserClient` from @supabase/ssr. That one keeps
 * the session in cookies it can read, which is exactly what stops those
 * cookies from being HttpOnly. Everything that needs the signed-in user runs
 * on the server instead, so this client is only ever used for one thing:
 * pushing a file at an upload URL the server already signed. The signed token
 * is the authorisation, and it is good for one path and a few minutes.
 */
export function createClient() {
  return createSupabaseClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
