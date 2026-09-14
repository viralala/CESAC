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

  const isGate = pathname === "/signin" || pathname === "/signup";
  const isConsole =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/account");

  if (!user && isConsole) {
    const to = request.nextUrl.clone();
    to.pathname = "/signin";
    to.search = `?next=${encodeURIComponent(pathname + search)}`;
    return keepCookies(NextResponse.redirect(to), response);
  }

  // Signed in and standing at the gate. The consoles sort out which one.
  if (user && isGate) {
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
     * Everything except static assets, image optimisation and the auth
     * callback. The callback sets the session cookies itself and must not be
     * intercepted on the way in.
     */
    "/((?!_next/static|_next/image|auth/callback|favicon.ico|icon.svg|opengraph-image|.*\.(?:svg|png|jpg|jpeg|gif|webp|avif|mp3|ogg|wav|woff2?)$).*)",
  ],
};
