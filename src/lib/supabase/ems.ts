import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";
import type { EmsDatabase } from "./ems.types";

/**
 * The event management system lives in its own Postgres schema, so it needs
 * its own client. Same project, same cookies, same session: only the schema
 * the queries land in differs.
 *
 * Everything said in server.ts about why a client is built per request rather
 * than hoisted to a module constant applies here for the same reason. The
 * cookie jar belongs to one request.
 *
 * This needs `ems` to be listed under Project Settings > API > Exposed
 * schemas in the Supabase dashboard. Until it is, every call returns
 * PGRST106 and the helper below turns that into something readable.
 */
export async function createEmsClient() {
  const jar = await cookies();

  return createServerClient<EmsDatabase, "ems">(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    db: { schema: "ems" },
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
 * PostgREST's "that schema is not exposed" code.
 *
 * Until `ems` is listed under Exposed schemas, every call in this schema
 * comes back with this and nothing else. It is worth naming, because the
 * alternative is a console that silently shows an empty board and an admin
 * who gets bounced back to the dashboard with no idea why.
 */
export const SCHEMA_NOT_EXPOSED = "PGRST106";

const SETUP_MESSAGE =
  "The event system is not switched on yet. In Supabase, open Project Settings, API, and add ems to Exposed schemas.";

/**
 * Turns a Postgres error into something a person can act on.
 *
 * Supabase prefixes RAISE EXCEPTION messages with the SQLSTATE context, and
 * every message the ems functions raise is already written for a person, so
 * the prefix is all that has to come off. The one error that is never the
 * user's fault and always has the same fix says so plainly.
 */
export function readableError(error: { message: string; code?: string } | null): string | null {
  if (!error) return null;
  if (error.code === SCHEMA_NOT_EXPOSED) return SETUP_MESSAGE;

  return error.message.replace(/^.*?:\s*/, "");
}

/**
 * Whether the schema is reachable through the API at all.
 *
 * One cheap call, cached for the request. The pages ask this so they can say
 * "somebody has to switch this on" rather than rendering an empty console,
 * which would look identical to a term with no events in it.
 */
export const emsSchemaReady = cache(async (): Promise<boolean> => {
  const supabase = await createEmsClient();
  const { error } = await supabase.rpc("is_admin");
  return error?.code !== SCHEMA_NOT_EXPOSED;
});

export { SETUP_MESSAGE };
