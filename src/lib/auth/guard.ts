import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { homeFor, viewerFrom, type Role, type Viewer } from "./session";

/**
 * The authoritative check.
 *
 * The proxy bounces the obvious cases early, but it is an optimisation and
 * nothing more: it reads a cookie on the edge and can be wrong about a role
 * that changed a second ago. Every protected page calls one of these, and
 * this is the call that decides.
 *
 * cache() makes it once per request no matter how many components ask.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createClient();

  /*
   * getClaims rather than getUser, which this used to call.
   *
   * getUser asks the auth server whether the token is real, over the network,
   * and the proxy has already asked the same question a moment earlier on the
   * same request. Two round trips to Mumbai before a page had read a single
   * row is most of why the organiser console felt slow.
   *
   * This is not a weakening. The project signs its tokens with ES256, so the
   * signature is checked here against the project's published public key,
   * cached after the first request. A tampered token fails. What is dropped is
   * the trip, not the verification, and the role is read from the profile row
   * below either way rather than from anything the token claims.
   */
  const { data: verified } = await supabase.auth.getClaims();
  const userId = verified?.claims?.sub;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  // No profile means the sign-up trigger has not landed yet, which is a blink
  // on a fresh OAuth account. Treat it as signed out rather than crashing;
  // the next request will find the row.
  return profile ? viewerFrom(profile) : null;
});

function toGate(role: Role, next: string): never {
  redirect(`/signin?next=${encodeURIComponent(next)}${role === "admin" ? "&role=admin" : ""}`);
}

/**
 * The one place a still-imported account is turned away.
 *
 * A bulk-imported student's first password is their own email address, which
 * every classmate knows. The window where that is true has to be as close to
 * zero as the app can make it, so the check sits in the same function every
 * protected page already calls rather than in a layout or the proxy, where a
 * page added later could quietly miss it. The change-password screen itself
 * calls getViewer directly and never this, so there is no loop.
 *
 * Exported because the event system has its own guards in lib/ems/access.ts,
 * built on getViewer rather than on requireRole. They have to call this
 * themselves, and the first cut of them did not, which is exactly the miss
 * this comment warns about.
 */
export function gateUnsetPassword(viewer: Viewer): void {
  if (viewer.mustChangePassword) redirect("/account/password?first=1");
}

async function requireRole(role: Role, next: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) toGate(role, next);

  gateUnsetPassword(viewer);

  const wantsAdmin = role === "admin" || role === "owner";
  if (wantsAdmin && !viewer.isAdmin) redirect("/dashboard");
  if (!wantsAdmin && viewer.isAdmin) redirect("/admin");

  return viewer;
}

/**
 * Organisers are sent to their own console rather than shown the participant
 * one, because an organiser has no team and every panel would be empty.
 */
export function requireParticipant(): Promise<Viewer> {
  return requireRole("participant", "/dashboard");
}

export function requireAdmin(): Promise<Viewer> {
  return requireRole("admin", "/admin");
}

export { homeFor };
