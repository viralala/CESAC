import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type Profile = Tables<"profiles">;

/**
 * The signed-in student's own row, whole.
 *
 * Viewer carries the four things every page needs. This carries the rest —
 * PRN, class, mobile — which only the student data screens ask for, so the
 * common case does not pay for columns it will not print.
 */
export const getMyProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data ?? null;
});

export type Standing = {
  place: number;
  points: number;
  certificates: number;
  rankedStudents: number;
  prizeTotalInr: number;
};

/**
 * Where the student stands, or null when they have uploaded nothing.
 *
 * Null is the honest answer for an empty record. A console that answers
 * "#1,871 of 1,871" to somebody who has never uploaded anything has invented
 * a position out of an absence, and the whole board is worth less for it.
 */
export const getMyStanding = cache(async (): Promise<Standing | null> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_standing");

  const row = Array.isArray(data) ? data[0] : null;
  if (!row) return null;

  return {
    place: Number(row.place),
    points: Number(row.points),
    certificates: Number(row.certificates),
    rankedStudents: Number(row.ranked_students),
    prizeTotalInr: Number(row.prize_total_inr),
  };
});

export type BoardRow = {
  place: number;
  studentId: string;
  name: string;
  year: string | null;
  points: number;
  certificates: number;
};

/**
 * The top of the board.
 *
 * A student can only read their own profile, so this cannot be a join: the
 * database hands back names through a function written for the purpose, and
 * that function returns a name, a year and two counts. No address, no phone,
 * no PRN, and nobody who has uploaded nothing.
 */
export const getRankingBoard = cache(async (limit = 10): Promise<BoardRow[]> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("ranking_board", { p_limit: limit });

  return (data ?? []).map((row) => ({
    place: Number(row.place),
    studentId: row.student_id,
    name: row.name,
    year: row.year,
    points: Number(row.points),
    certificates: Number(row.certificates),
  }));
});
