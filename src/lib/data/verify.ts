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
