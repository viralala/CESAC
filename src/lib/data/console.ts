import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Enums, Tables } from "@/lib/supabase/database.types";

export type Settings = Tables<"settings">;
export type Chapter = Tables<"chapters">;
export type Team = Tables<"teams">;
export type Payment = Tables<"payments">;
export type Submission = Tables<"submissions">;
export type SubmissionFile = Tables<"submission_files">;
export type LeaderboardRow = Tables<"leaderboard">;

export type Member = Pick<Tables<"profiles">, "id" | "full_name" | "email" | "avatar_url">;

const MEMBER_COLUMNS = "id, full_name, email, avatar_url";

/**
 * The switches organisers flip. Readable signed out, because the public event
 * page has to know whether registration is open before it invites anybody to
 * register.
 *
 * Falls back to a closed, empty configuration rather than throwing: a page
 * that cannot reach the database should say registration is shut, never crash.
 */
export const getSettings = cache(async (): Promise<Settings> => {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("*").eq("id", 1).single();

  return (
    data ?? {
      id: 1,
      registration_open: false,
      seats_cap: 50,
      entry_fee_inr: 200,
      leaderboard_public: false,
      online_payment: false,
      upi_id: null,
      upi_payee_name: null,
      announcement: null,
      updated_by: null,
      updated_at: new Date().toISOString(),
    }
  );
});

export const getChapters = cache(async (): Promise<Chapter[]> => {
  const supabase = await createClient();
  const { data } = await supabase.from("chapters").select("*").order("position");
  return data ?? [];
});

export type TeamWithPeople = Team & {
  captain: Member | null;
  partner: Member | null;
  payment: Payment | null;
};

/**
 * The signed-in participant's team, or null when they have not made or joined
 * one. Row level security does the filtering: this same query run by someone
 * else returns their team, and by nobody returns nothing.
 */
export const getMyTeam = cache(async (): Promise<TeamWithPeople | null> => {
  const supabase = await createClient();

  const { data } = await supabase
    .from("teams")
    .select(
      `*,
       captain:profiles!teams_captain_id_fkey(${MEMBER_COLUMNS}),
       partner:profiles!teams_partner_id_fkey(${MEMBER_COLUMNS}),
       payment:payments(*)`,
    )
    .maybeSingle();

  if (!data) return null;

  // payments is a one-to-many relation in the schema cache even though a
  // unique index makes it one row, so it arrives as an array.
  const payment = Array.isArray(data.payment) ? (data.payment[0] ?? null) : (data.payment ?? null);
  return { ...data, payment } as TeamWithPeople;
});

export type SubmissionWithFiles = Submission & { files: SubmissionFile[] };

export const getMySubmissions = cache(async (): Promise<SubmissionWithFiles[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("submissions")
    .select("*, files:submission_files(*)")
    .order("created_at");

  return (data ?? []).map((row) => ({
    ...row,
    files: (row.files ?? []) as SubmissionFile[],
  })) as SubmissionWithFiles[];
});

export type Standing = LeaderboardRow & { rank: number };

/**
 * The board, ranked.
 *
 * What comes back depends on who is asking, and that is enforced in the
 * database rather than here: before organisers publish it, a participant's
 * query returns their own row and nothing else. So a rank is only meaningful
 * when `published` is true, and callers must not show one otherwise.
 */
export const getLeaderboard = cache(
  async (): Promise<{ rows: Standing[]; published: boolean }> => {
    const supabase = await createClient();
    const [{ data }, settings] = await Promise.all([
      supabase.from("leaderboard").select("*").order("total", { ascending: false }),
      getSettings(),
    ]);

    const rows = (data ?? []).map((row, i) => ({ ...row, rank: i + 1 }));
    return { rows, published: settings.leaderboard_public };
  },
);

/** Everything the organiser console counts, in one place. */
export type AdminOverview = {
  teams: TeamWithPeople[];
  counts: {
    teams: number;
    registered: number;
    forming: number;
    seated: number;
    awaitingVerification: number;
    paid: number;
    participants: number;
    organisers: number;
  };
};

export const getAdminOverview = cache(async (): Promise<AdminOverview> => {
  const supabase = await createClient();

  const [teamsResult, profileCounts] = await Promise.all([
    supabase
      .from("teams")
      .select(
        `*,
         captain:profiles!teams_captain_id_fkey(${MEMBER_COLUMNS}),
         partner:profiles!teams_partner_id_fkey(${MEMBER_COLUMNS}),
         payment:payments(*)`,
      )
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("role"),
  ]);

  const teams = (teamsResult.data ?? []).map((row) => {
    const payment = Array.isArray(row.payment) ? (row.payment[0] ?? null) : (row.payment ?? null);
    return { ...row, payment } as TeamWithPeople;
  });

  const roles = profileCounts.data ?? [];

  return {
    teams,
    counts: {
      teams: teams.length,
      registered: teams.filter((t) => t.status === "registered").length,
      forming: teams.filter((t) => t.status === "forming").length,
      seated: teams.filter((t) => t.seat !== null).length,
      awaitingVerification: teams.filter((t) => t.payment?.status === "submitted").length,
      paid: teams.filter((t) => t.payment?.status === "verified").length,
      participants: roles.filter((r) => r.role === "participant").length,
      organisers: roles.filter((r) => r.role === "admin" || r.role === "owner").length,
    },
  };
});

export const getOrganisers = cache(async (): Promise<Tables<"profiles">[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["admin", "owner"])
    .order("created_at");
  return data ?? [];
});

export const getAuditLog = cache(async (limit = 12): Promise<Tables<"audit_log">[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
});

/** Every hand-in for one chapter, for the grading table. */
export const getChapterSubmissions = cache(
  async (chapterId: string): Promise<(SubmissionWithFiles & { team: Team | null })[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("submissions")
      .select("*, files:submission_files(*), team:teams(*)")
      .eq("chapter_id", chapterId)
      .order("submitted_at", { nullsFirst: false });

    return (data ?? []).map((row) => ({
      ...row,
      files: (row.files ?? []) as SubmissionFile[],
    })) as (SubmissionWithFiles & { team: Team | null })[];
  },
);

export type PaymentStatus = Enums<"payment_status">;
export type TeamStatus = Enums<"team_status">;
export type ChapterState = Enums<"chapter_state">;

export type EventStats = {
  registration_open: boolean;
  seats_cap: number;
  entry_fee_inr: number;
  teams_registered: number;
  seats_taken: number;
};

/**
 * The one aggregate a signed-out visitor can see.
 *
 * Everything else about teams is closed to anon, and stays closed. This is a
 * count of rows, which gives away nothing about any row, and it is the fact
 * that decides whether the public page says "register" or "sold out".
 */
export const getEventStats = cache(async (): Promise<EventStats> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("event_stats");

  return (
    (data as EventStats | null) ?? {
      registration_open: false,
      seats_cap: 50,
      entry_fee_inr: 200,
      teams_registered: 0,
      seats_taken: 0,
    }
  );
});
