import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type VerifiableFile = Tables<"certificate_files">;

/**
 * A record as a verifier sees it.
 *
 * Its own read rather than getCertificatesForReview, and the difference is
 * the joins. That one asks for the verifier and the organiser who entered the
 * row, both of which are committee profiles; a verifier's read policy stops
 * at students, so PostgREST would hand back nulls and the page would print a
 * row of blanks. Asking only for what this console can actually see keeps the
 * two honest.
 */
export type RecordToCheck = Tables<"certificates"> & {
  owner: Pick<
    Tables<"profiles">,
    "id" | "full_name" | "email" | "prn" | "student_class" | "year"
  > | null;
  files: VerifiableFile[];
};

/**
 * Every record on the site, oldest first.
 *
 * The whole table, on purpose: the queue is the job, and a queue that stops at
 * a limit is a queue with rows in it nobody ever decides about. Row level
 * security is what makes this safe rather than a filter written here, and the
 * policy behind it is `certificates_read_verifier`.
 */
export const getRecordsToCheck = cache(async (): Promise<RecordToCheck[]> => {
  const supabase = await createClient();

  const { data } = await supabase
    .from("certificates")
    .select(
      `*,
       owner:profiles!certificates_owner_id_fkey(id, full_name, email, prn, student_class, year),
       files:certificate_files(*)`,
    )
    .order("created_at", { ascending: true });

  return (data ?? []).map((row) => ({
    ...row,
    files: (row.files ?? []) as VerifiableFile[],
  })) as unknown as RecordToCheck[];
});

export type QuestionToAnswer = Tables<"queries"> & {
  author: Pick<
    Tables<"profiles">,
    "id" | "full_name" | "email" | "prn" | "student_class" | "year"
  > | null;
};

/**
 * Every question anybody has asked, oldest first.
 *
 * Oldest first is the feature rather than a preference. A student may have
 * five questions waiting at once and no more, so a queue worked from the new
 * end leaves the earliest askers sitting on all five of their slots, unable to
 * ask anything further and with no way of knowing why.
 *
 * No `answerer` join, unlike the organiser's read of the same table. That
 * column points at a committee profile and a verifier's read policy stops at
 * students, so asking for it would return a row of nulls. Whoever answered is
 * in the audit log, which is where a question about who said what belongs.
 */
export const getQuestionsToAnswer = cache(async (): Promise<QuestionToAnswer[]> => {
  const supabase = await createClient();

  const { data } = await supabase
    .from("queries")
    .select(
      `*,
       author:profiles!queries_author_id_fkey(id, full_name, email, prn, student_class, year)`,
    )
    .order("created_at", { ascending: true });

  return (data ?? []) as unknown as QuestionToAnswer[];
});
