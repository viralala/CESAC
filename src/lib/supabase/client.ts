"use client";

import { createBrowserClient } from "@supabase/ssr";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";
import type { Database } from "./database.types";

/**
 * The browser client.
 *
 * Used only where the browser genuinely has to talk to Supabase itself: the
 * OAuth hand-off, which needs to set a PKCE verifier before leaving the page,
 * and file uploads, which would otherwise have to pass the whole video
 * through a server action. Everything else reads and writes from the server.
 */
export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}
