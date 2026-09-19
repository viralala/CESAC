import "server-only";

import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";
import type { Database } from "./database.types";

/**
 * The server client, bound to this request's cookies.
 *
 * A new one per request, never hoisted to a module constant: the cookie jar
 * it closes over belongs to one request, and sharing it across requests would
 * eventually hand one visitor another visitor's session.
 *
 * Writing cookies from a Server Component is not allowed, so setAll throws
 * there and is swallowed. That is safe because the proxy refreshes the
 * session on every matched request and writes the refreshed cookies itself.
 *
 * httpOnly is forced on. The library leaves it off so that its own browser
 * client can read the session, which means a single cross-site script could
 * walk off with a working access and refresh token. Nothing in this app needs
 * to read the session from JavaScript: every read and write goes through the
 * server, and uploads use a signed URL minted per file. So the tokens stay out
 * of reach of any script on the page.
 */
export async function createClient() {
  const jar = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return jar.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            jar.set(name, value, { ...options, httpOnly: true });
          }
        } catch {
          // Called from a Server Component. The proxy already refreshed it.
        }
      },
    },
  });
}

/**
 * A client that answers to nobody's session.
 *
 * Row level security does not apply to it and neither does any policy, so it
 * exists for exactly one job: calling the handful of functions that refuse
 * anything but the service role. public.confirm_event_razorpay_payment is
 * the one that matters, because marking a fee paid has to be something a
 * student cannot do by talking to the console, and "the console promises not
 * to" is not the same as "Postgres refuses".
 *
 * Returns null rather than throwing when the key is missing, so a deploy
 * without it degrades to a readable message instead of a stack trace on the
 * one page where money has just changed hands.
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;

  return createSupabaseClient<Database>(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
