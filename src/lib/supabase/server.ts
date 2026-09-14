import "server-only";

import { createServerClient } from "@supabase/ssr";
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
            jar.set(name, value, options);
          }
        } catch {
          // Called from a Server Component. The proxy already refreshed it.
        }
      },
    },
  });
}
