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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
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
 */
function gateUnsetPassword(viewer: Viewer): void {
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
