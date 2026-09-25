import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { gateMissingPhoto, gateUnsetPassword, getViewer } from "@/lib/auth/guard";
import type { Viewer } from "@/lib/auth/session";
import { createEmsClient, SCHEMA_NOT_EXPOSED } from "@/lib/supabase/ems";

/**
 * What the signed-in person may do inside the event management system.
 *
 * The live console has one axis, participant or organiser, held in
 * profiles.role. The ems schema adds a second: a committee admin runs
 * everything, a teacher admin watches and cannot touch. The two systems are
 * bridged in the database rather than here, by ems.is_committee_admin(),
 * which counts an existing profiles.role of 'admin' or 'owner' as committee.
 * So every organiser who already exists keeps working on day one, and an
 * explicit teacher row still overrides the bridge.
 *
 * These call the database rather than reasoning about roles locally, because
 * the rule that matters is the one RLS enforces. A copy of it in TypeScript
 * would be a second rule, and the two would drift.
 */
export type EmsAccess = {
  viewer: Viewer;
  /** Full administrative access. */
  isCommittee: boolean;
  /** Oversight and analytics. Cannot enter events or manage organisers. */
  isTeacher: boolean;
  /** Either kind of admin. */
  isAdmin: boolean;
  /**
   * False while `ems` is still missing from Supabase's exposed schemas.
   *
   * Every call in the schema fails identically until somebody ticks that box,
   * and a console cannot tell that apart from a term with no events in it. So
   * it is carried explicitly and the page says what has to happen.
   */
  schemaReady: boolean;
};

export const getEmsAccess = cache(async (): Promise<EmsAccess | null> => {
  const viewer = await getViewer();
  if (!viewer) return null;

  const supabase = await createEmsClient();

  const [committee, teacher] = await Promise.all([
    supabase.rpc("is_committee_admin"),
    supabase.rpc("is_teacher_admin"),
  ]);

  // Nothing can be asked of a schema the API will not route to. Fall back to
  // the role the live console already holds, which is the same answer
  // ems.is_committee_admin() would give through its bridge, so the person who
  // can fix the setting is the one who gets told about it.
  if (
    committee.error?.code === SCHEMA_NOT_EXPOSED ||
    teacher.error?.code === SCHEMA_NOT_EXPOSED
  ) {
    return {
      viewer,
      isCommittee: viewer.isAdmin,
      isTeacher: false,
      isAdmin: viewer.isAdmin,
      schemaReady: false,
    };
  }

  const isCommittee = committee.data === true;
  const isTeacher = teacher.data === true;

  return {
    viewer,
    isCommittee,
    isTeacher,
    isAdmin: isCommittee || isTeacher,
    schemaReady: true,
  };
});

/**
 * Whether this person organises this one event.
 *
 * Committee admins reach every event, which the database function already
 * accounts for, so this is one call and not a special case here.
 */
export async function isEventOrganiser(eventId: string): Promise<boolean> {
  const supabase = await createEmsClient();
  const { data } = await supabase.rpc("is_event_organiser", { p_event_id: eventId });
  return data === true;
}

/**
 * Guards for the pages that need one.
 *
 * Same two-locks-on-one-door arrangement the live console uses: this gives a
 * clean redirect instead of an error page, and the check inside every ems
 * function is the one that actually holds if this file is ever wrong.
 */
export async function requireEmsAdmin(): Promise<EmsAccess> {
  const access = await getEmsAccess();
  if (!access) redirect("/signin?next=/admin/events&role=admin");

  // Same door, same lock as every other console page. These guards are built
  // on getViewer rather than requireRole, so nothing applies this for them.
  gateUnsetPassword(access.viewer);
  gateMissingPhoto(access.viewer, "/admin/events");

  if (!access.isAdmin) redirect("/dashboard");
  return access;
}

/**
 * For the things a teacher admin must not do: creating events, assigning
 * organisers, changing who is an admin. Sends a teacher back to the console
 * they can use rather than showing them a wall.
 */
export async function requireCommitteeAdmin(): Promise<EmsAccess> {
  const access = await requireEmsAdmin();
  if (!access.isCommittee) redirect("/admin/events");
  return access;
}
