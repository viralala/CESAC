import { NextResponse, type NextRequest } from "next/server";

import { homeFor, SESSION_COOKIE, verifySession } from "@/lib/auth/session";

/**
 * The early bounce, and nothing more.
 *
 * Next's own guidance is that proxy is an optimistic check, not the
 * authorisation layer: it keeps a signed-out visitor from loading the console
 * shell at all, while `requireParticipant` / `requireAdmin` do the real check
 * on the server for every protected page. Deleting this file would cost a
 * flash of console chrome, not access control.
 */
const AREAS = [
  { prefix: "/admin", role: "admin" as const },
  { prefix: "/dashboard", role: "participant" as const },
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  // Already through the gate? The gate is not where you want to be.
  if (pathname === "/signin") {
    if (!session) return NextResponse.next();
    return NextResponse.redirect(new URL(homeFor(session.role), request.url));
  }

  const area = AREAS.find(
    (a) => pathname === a.prefix || pathname.startsWith(`${a.prefix}/`),
  );
  if (!area) return NextResponse.next();

  if (!session) {
    const gate = new URL("/signin", request.url);
    gate.searchParams.set("role", area.role);
    gate.searchParams.set("next", pathname);
    return NextResponse.redirect(gate);
  }

  if (session.role !== area.role) {
    return NextResponse.redirect(new URL(homeFor(session.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/signin", "/admin/:path*", "/dashboard/:path*"],
};
