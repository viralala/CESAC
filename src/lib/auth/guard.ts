import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { homeFor, viewerFrom, type Viewer } from "./session";

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

function toGate(want: Want, next: string): never {
  redirect(`/signin?next=${encodeURIComponent(next)}${want === "admin" ? "&role=admin" : ""}`);
}

/** The three consoles, as the thing a page asks for, plus one crosscutting one. */
type Want = "participant" | "admin" | "verifier" | "record";

function holds(viewer: Viewer, want: Want): boolean {
  if (want === "admin") return viewer.isAdmin;
  if (want === "verifier") return viewer.isVerifier;
  // Most organisers are students too, and file a certificate like any other
  // student. Everything else behind requireParticipant stays theirs alone.
  if (want === "record") return viewer.role === "participant" || viewer.isAdmin;
  return viewer.role === "participant";
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

/**
 * The second step every student takes once, after the password: a photo.
 *
 * Same shape and same reasoning as the password gate above, and it runs after
 * it, so a freshly imported student chooses a password first and a photo
 * second rather than being shown the two in whichever order they arrive.
 * `next` is where they were going, so finishing the step drops them there.
 *
 * Exported for the event system's guards in lib/ems/access.ts, which call the
 * pair of these themselves.
 */
export function gateMissingPhoto(viewer: Viewer, next = "/dashboard"): void {
  if (viewer.needsPhoto) redirect(`/account/photo?next=${encodeURIComponent(next)}`);
}

/**
 * Somebody is standing at a console. Is it theirs?
 *
 * Whoever it is not gets sent to their own, rather than to a wall, because
 * every one of these three has a home and landing on the right one is more
 * use than being told which one is wrong. That is also why the wrong-console
 * case reads `homeFor(viewer.role)` and not a hard-coded path: when the
 * verifier was added, this function did not have to change.
 */
async function requireRole(want: Want, next: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) toGate(want, next);

  gateUnsetPassword(viewer);
  gateMissingPhoto(viewer, next);

  if (!holds(viewer, want)) redirect(homeFor(viewer.role));

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

/**
 * The record checker's console.
 *
 * A verifier is not a narrowed organiser and this is not requireAdmin with a
 * capability: `isAdmin` is false for them, so every policy and every page
 * written against `is_admin()` keeps them out with no branch of its own.
 */
export function requireVerifier(): Promise<Viewer> {
  return requireRole("verifier", "/verify");
}

/**
 * Whoever a record actually belongs to: a participant, or an organiser filing
 * their own. Used by the certificate actions only; the review queue and every
 * other participant page still go through requireParticipant.
 */
export function requireRecordOwner(): Promise<Viewer> {
  return requireRole("record", "/dashboard");
}

export { homeFor };
