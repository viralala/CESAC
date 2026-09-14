/**
 * Session handling.
 *
 * One signed cookie, nothing else. The payload carries the account id, the
 * role and the display name, which is everything the console shells need to
 * render without a second lookup. No email, no team roster, no password
 * material: a cookie is not a database row.
 *
 * Signing uses HS256 through jose so the same token verifies in the Node
 * runtime (server actions, pages) and in the edge runtime (`src/proxy.ts`),
 * where `node:crypto` is not available.
 */

import { SignJWT, jwtVerify } from "jose";

export type Role = "participant" | "admin";

export type Session = {
  /** Account id, not the email. */
  sub: string;
  role: Role;
  /** What the console greets them with. */
  name: string;
};

export const SESSION_COOKIE = "aot_session";

/** Seven days. Long enough to span the two event days plus the week before. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const FALLBACK_SECRET = "attack-on-token-development-secret-do-not-ship";

let warned = false;

function secret(): Uint8Array {
  const configured = process.env.AOT_SESSION_SECRET;

  if (!configured || configured.length < 32) {
    if (!warned && process.env.NODE_ENV === "production") {
      warned = true;
      console.warn(
        "[auth] AOT_SESSION_SECRET is unset or shorter than 32 characters. " +
          "Sessions are being signed with the built-in development key, which " +
          "is public. Set AOT_SESSION_SECRET in the Vercel project settings.",
      );
    }
    return new TextEncoder().encode(FALLBACK_SECRET);
  }

  return new TextEncoder().encode(configured);
}

export async function signSession(session: Session): Promise<string> {
  return new SignJWT({ role: session.role, name: session.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.sub)
    .setIssuedAt()
    .setIssuer("cesac-aot")
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

/**
 * Verify a token. Returns null for anything that does not check out, which
 * includes an expired token, a token signed with a different secret and a
 * token whose role is not one we issue. Callers treat null as signed out.
 */
export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret(), {
      algorithms: ["HS256"],
      issuer: "cesac-aot",
    });

    const role = payload.role;
    const name = payload.name;

    if (typeof payload.sub !== "string") return null;
    if (role !== "participant" && role !== "admin") return null;
    if (typeof name !== "string") return null;

    return { sub: payload.sub, role, name };
  } catch {
    return null;
  }
}

/** Where a role lands once it is through the gate. */
export function homeFor(role: Role): string {
  return role === "admin" ? "/admin" : "/dashboard";
}
