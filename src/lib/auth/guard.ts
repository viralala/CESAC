import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { SESSION_COOKIE, verifySession, type Role, type Session } from "@/lib/auth/session";

/**
 * The authoritative check.
 *
 * `src/proxy.ts` also looks at the cookie, but only to bounce obvious cases
 * early. Nothing is allowed to trust that: every protected page calls one of
 * these, which re-verifies the signature on the server. `cache` keeps that to
 * one verification per request even when a layout and its page both ask.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySession(token);
});

/** Send a signed-out visitor to the gate, remembering where they were headed. */
function toGate(role: Role, next: string): never {
  const params = new URLSearchParams({ role, next });
  redirect(`/signin?${params.toString()}`);
}

export async function requireRole(role: Role, next: string): Promise<Session> {
  const session = await getSession();

  if (!session) toGate(role, next);

  // A participant who finds /admin is not told the page exists; they get their
  // own console back. Wrong-role traffic is a mistake, not an attack surface.
  if (session.role !== role) redirect(session.role === "admin" ? "/admin" : "/dashboard");

  return session;
}

export const requireParticipant = () => requireRole("participant", "/dashboard");
export const requireAdmin = () => requireRole("admin", "/admin");
