import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

/**
 * Two jobs, in this order.
 *
 * First, refresh the session. Access tokens are short lived and a Server
 * Component cannot write a cookie, so if this does not happen here nothing
 * renews it and a signed-in visitor is quietly logged out mid-event.
 *
 * Second, an optimistic bounce. It only asks whether there is a valid session,
 * never what role it carries, because a role check belongs where it can be
 * trusted and be current: requireParticipant and requireAdmin on the page
 * itself. This is here to save a render, not to be the lock.
 */
export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname, search } = request.nextUrl;

  const isGate = pathname === "/signin";
  const isConsole =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/verify" ||
    pathname.startsWith("/verify/") ||
    pathname.startsWith("/account");

  if (!user && isConsole) {
    const to = request.nextUrl.clone();
    to.pathname = "/signin";
    to.search = `?next=${encodeURIComponent(pathname + search)}`;
    return keepCookies(NextResponse.redirect(to), response);
  }

  /*
   * Signed in and standing at the gate. The consoles sort out which one.
   *
   * Not when the address carries `next`. That parameter is written by one
   * thing only, toGate() in lib/auth/guard.ts, which is a page saying "this
   * session got as far as me and is not usable". Bouncing that request back to
   * the console sends it to the same page, which sends it here again, and the
   * two of them ping-pong until the browser gives up.
   *
   * The disagreement is real and not a mistake on either side. The proxy asks
   * whether the token is valid; the page asks whether there is a profile
   * behind it. Those come apart in two places: the blink after an OAuth
   * sign-up before the trigger has made the row, and the hour after an account
   * is deleted while its token is still in date. The second of those is new,
   * because verifying the token here rather than asking the auth server means
   * a deleted account still presents a token that checks out.
   *
   * So the page wins, which is right: it is the one that looked.
   */
  if (user && isGate && !request.nextUrl.searchParams.has("next")) {
    const to = request.nextUrl.clone();
    to.pathname = "/dashboard";
    to.search = "";
    return keepCookies(NextResponse.redirect(to), response);
  }

  return response;
}

/**
 * A redirect built here is a different response from the one updateSession
 * refreshed, and the refreshed tokens are on that one. Without this the
 * session is renewed and then thrown away on every bounce.
 */
function keepCookies(to: NextResponse, from: NextResponse): NextResponse {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie);
  }
  return to;
}

export const config = {
  matcher: [
    /*
     * Everything except static assets, image optimisation, profile photos and
     * the auth callback. The callback sets the session cookies itself and
     * must not be intercepted on the way in. A photo is public and cached at
     * the edge, and a refreshed session cookie on its response would stop
     * that cache from keeping it.
     */
    "/((?!_next/static|_next/image|photo/|auth/callback|favicon.ico|icon.svg|opengraph-image|.*\.(?:svg|png|jpg|jpeg|gif|webp|avif|mp3|ogg|wav|woff2?)$).*)",
  ],
};
