import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { PersonForOrganiser } from "@/lib/data/dept-events";
import type { Tables } from "@/lib/supabase/database.types";

export type Query = Tables<"queries">;

/**
 * The student's own questions, newest first.
 *
 * queries_read_own does the filtering. The explicit author filter is the
 * second lock, for the day somebody calls this from a page an organiser can
 * reach: an organiser passes that policy for every row in the table.
 */
export const getMyQueries = cache(async (): Promise<Query[]> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("queries")
    .select("*")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
});

export type QueryForOrganiser = Query & {
  author: PersonForOrganiser | null;
  /** The organiser who wrote the answer, once there is one. */
  answerer: Pick<Tables<"profiles">, "id" | "full_name"> | null;
};

/**
 * Every question anybody has asked, oldest first.
 *
 * Oldest first is the feature rather than a preference. A student may have
 * five questions waiting at once and no more, so a queue worked from the new
 * end leaves the earliest askers sitting on all five of their slots, unable
 * to ask anything further and with no way of knowing why. Answering the
 * oldest first is what keeps that ceiling from behaving like a mute.
 *
 * There is no author filter here, unlike getMyQueries above, because this is
 * the organiser's read and it wants the whole table. queries_read_own is what
 * decides: it returns every row to an organiser and only their own to a
 * student, so this same call from the student console would still come back
 * with one person's questions.
 *
 * PRN and class ride along for the same reason the entries page takes them.
 * A question about a missing certificate or a wrong class is unanswerable
 * without knowing which row in the roster the asker is, and a name is not
 * enough to find one. PersonForOrganiser is reused rather than widening the
 * type the student side uses, which would hand students each other's PRNs.
 */
export const getQueryQueue = cache(async (): Promise<QueryForOrganiser[]> => {
  const supabase = await createClient();

  const people = "id, full_name, email, prn, student_class";

  const { data } = await supabase
    .from("queries")
    .select(
      `*,
       author:profiles!queries_author_id_fkey(${people}),
       answerer:profiles!queries_answered_by_fkey(id, full_name)`,
    )
    .order("created_at", { ascending: true });

  return (data ?? []) as unknown as QueryForOrganiser[];
});
