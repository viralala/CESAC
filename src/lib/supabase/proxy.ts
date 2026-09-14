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

  // getUser, not getSession: this one asks the auth server whether the token
  // is real, which is the whole point of doing it here.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
