import "server-only";

import { cache } from "react";

import { createEmsClient } from "@/lib/supabase/ems";
import type { EmsTables, EmsViews } from "@/lib/supabase/ems.types";

export type EmsEvent = EmsTables<"events">;
export type EmsTeam = EmsTables<"teams">;
export type EmsRegistration = EmsTables<"event_registrations">;

export type EventCard = EmsViews<"event_board">;
export type RosterRow = EmsViews<"team_roster">;
export type Invitation = EmsViews<"my_invitations">;
export type AdminRow = EmsViews<"admin_directory">;
export type OrganiserRow = EmsViews<"organiser_directory">;
export type RegistrationRow = EmsViews<"registration_board">;
export type AuditRow = EmsViews<"audit_feed">;
export type EventStats = EmsViews<"event_participation_analytics">;
export type AchievementRow = EmsViews<"student_achievement_summary">;

/**
 * Every read here goes through ems.event_board and its sibling views rather
 * than the tables, and that is deliberate. PostgREST cannot embed a resource
 * across schemas, so a query against ems.teams cannot carry the leader's name
 * from public.profiles. The views do that join in the database, and each one
 * carries its own access check because it bypasses RLS to reach across. The
 * reasoning is written out at the read-views section of the migration.
 *
 * All of them fail soft. A console that cannot reach the database should show
 * an empty board, not a crash, and the seat counts are advisory anyway: the
 * only count that decides anything is the one register_team takes under a
 * row lock.
 */

/** Every event this viewer may see, newest registration window first. */
export const getEventBoard = cache(async (): Promise<EventCard[]> => {
  const supabase = await createEmsClient();
  const { data } = await supabase
    .from("event_board")
    .select("*")
    .order("registration_start", { ascending: false });
  return data ?? [];
});

export const getEvent = cache(async (eventId: string): Promise<EventCard | null> => {
  const supabase = await createEmsClient();
  const { data } = await supabase.from("event_board").select("*").eq("id", eventId).maybeSingle();
  return data ?? null;
});

/**
 * The people on one team, leader first, then everyone who has accepted, then
 * the invitations still waiting. Sorting here rather than in SQL because the
 * order is a presentation decision and the list is never longer than eight.
 */
export const getTeamRoster = cache(async (teamId: string): Promise<RosterRow[]> => {
  const supabase = await createEmsClient();
  const { data } = await supabase.from("team_roster").select("*").eq("team_id", teamId);

  const rank = { accepted: 0, invited: 1, rejected: 2 } as const;

  return (data ?? []).sort((a, b) => {
    if (a.is_leader !== b.is_leader) return a.is_leader ? -1 : 1;
    if (a.status !== b.status) return rank[a.status] - rank[b.status];
    return (a.full_name ?? a.email).localeCompare(b.full_name ?? b.email);
  });
});

/**
 * The registrations behind a set of teams.
 *
 * Takes the team ids rather than reading the whole table, because RLS on
 * ems.event_registrations lets an admin see every row and this is called from
 * the student console. Passing the ids keeps the query saying what it means
 * regardless of who is asking.
 */
export const getRegistrationsForTeams = cache(
  async (teamIds: readonly string[]): Promise<EmsRegistration[]> => {
    if (teamIds.length === 0) return [];

    const supabase = await createEmsClient();
    const { data } = await supabase
      .from("event_registrations")
      .select("*")
      .in("team_id", [...teamIds]);
    return data ?? [];
  },
);

/** Invitations waiting on the signed-in student. */
export const getMyInvitations = cache(async (): Promise<Invitation[]> => {
  const supabase = await createEmsClient();
  const { data } = await supabase
    .from("my_invitations")
    .select("*")
    .order("invited_at", { ascending: false });
  return data ?? [];
});

/** The entries for one event, for the people running it. */
export const getRegistrations = cache(async (eventId: string): Promise<RegistrationRow[]> => {
  const supabase = await createEmsClient();
  const { data } = await supabase
    .from("registration_board")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  return data ?? [];
});

export const getAdminDirectory = cache(async (): Promise<AdminRow[]> => {
  const supabase = await createEmsClient();
  const { data } = await supabase.from("admin_directory").select("*").order("created_at");
  return data ?? [];
});

export const getOrganisers = cache(async (eventId?: string): Promise<OrganiserRow[]> => {
  const supabase = await createEmsClient();
  let query = supabase.from("organiser_directory").select("*");
  if (eventId) query = query.eq("event_id", eventId);
  const { data } = await query.order("created_at", { ascending: false });
  return data ?? [];
});

/** The committee's trail. Capped, because nobody reads past a screenful. */
export const getAuditFeed = cache(async (limit = 50): Promise<AuditRow[]> => {
  const supabase = await createEmsClient();
  const { data } = await supabase
    .from("audit_feed")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
});

export const getEventStats = cache(async (): Promise<EventStats[]> => {
  const supabase = await createEmsClient();
  const { data } = await supabase.from("event_participation_analytics").select("*");
  return data ?? [];
});

/**
 * Certificate standing per student, read out of public.certificates.
 *
 * There is one certificate store and this is a view over it, so the numbers
 * here and the numbers on the student's own certificates page can never
 * disagree. RLS on public.certificates still applies through the view, which
 * is why a student sees only their own row and an organiser sees the
 * department.
 */
export const getAchievements = cache(async (limit = 200): Promise<AchievementRow[]> => {
  const supabase = await createEmsClient();
  const { data } = await supabase
    .from("student_achievement_summary")
    .select("*")
    .order("certificates", { ascending: false })
    .limit(limit);
  return data ?? [];
});

/**
 * Whether an address is on the committee's approved roll.
 *
 * Advisory, and nothing on the sign-in path calls it. It exists so the
 * console can show who has been added, not to decide who may sign in: the
 * 1871 accounts already imported are not on this list and must keep working.
 */
export async function isApprovedStudent(email: string): Promise<boolean> {
  const supabase = await createEmsClient();
  const { data } = await supabase.rpc("is_approved_student_email", { p_email: email });
  return data === true;
}
