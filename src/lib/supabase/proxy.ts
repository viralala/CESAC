import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";
import type { Database } from "./database.types";

/**
 * Refreshes the session on the way past, and reports who is signed in.
 *
 * Access tokens are short lived. Server Components cannot write cookies, so
 * something upstream has to do the refresh and put the new pair on the
 * response, or a signed-in visitor gets logged out the moment their token
 * ages out. That something is the proxy.
 *
 * The returned response carries any refreshed cookies and the no-store
 * headers the library asks for alongside them, so no CDN can ever cache one
 * visitor's tokens and serve them to another.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          // Same reasoning as the server client: no script needs these, so no
          // script gets them.
          response.cookies.set(name, value, { ...options, httpOnly: true });
        }
        for (const [key, value] of Object.entries(headers ?? {})) {
          response.headers.set(key, value);
        }
      },
    },
  });

  /*
   * getClaims, not getUser and not getSession.
   *
   * All three answer "is this session real". getSession answers it by trusting
   * the cookie, which is no answer at all. getUser answers it by asking the
   * auth server, which is a network round trip on **every single request**,
   * and this proxy runs on every request that is not a static asset.
   *
   * getClaims verifies the token's signature itself. This project signs with
   * ES256, an asymmetric key, so the public half is enough to check it and the
   * library fetches that key set once and caches it. A forged or tampered
   * token fails the signature check exactly as it would at the auth server;
   * what is skipped is the trip, not the check. It still refreshes a session
   * that is about to expire, which is the proxy's other job.
   *
   * The site is served from Mumbai and its functions ran in Washington DC
   * until 21 September 2026, so this round trip and the second one in
   * getViewer were together most of a second on every console page before the
   * page had asked the database anything at all. vercel.json now pins the
   * functions to bom1 as well; both changes are about the same problem.
   */
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims ?? null;

  return { response, user: claims ? { id: claims.sub, email: claims.email } : null };
}
