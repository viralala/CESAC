import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import type { PersonForOrganiser } from "@/lib/data/dept-events";

export type Certificate = Tables<"certificates">;

/**
 * The signed-in student's certificates, newest first.
 *
 * Two things keep one student's files away from another. The real one is the
 * certificates_read_own policy, applied by Postgres to whoever holds the
 * session, so a page that forgets to narrow its query still cannot leak. The
 * owner filter here is the second: an organiser passes that policy for every
 * row in the table, and without it a function called getMyCertificates would
 * quietly return the whole department the day somebody calls it from an admin
 * page. The policy is the boundary; this is the function keeping its word.
 */
export const getMyCertificates = cache(async (): Promise<Certificate[]> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("certificates")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return data ?? [];
});

/**
 * What an organiser sees of the student a certificate belongs to.
 *
 * PersonForOrganiser rather than a shape of this file's own, and reused
 * rather than widened: the comment on it in dept-events.ts is the reason and
 * it holds here word for word. A class and a PRN are what tells two students
 * with the same name apart at a desk, and profiles_read_self would hand them
 * to a student-facing page as well if the shared type ever grew them.
 */
export type CertificateForOrganiser = Certificate & {
  owner: PersonForOrganiser | null;
  verifier: Pick<Tables<"profiles">, "id" | "full_name"> | null;
};

/**
 * Every certificate on the site, oldest first, for the review queue.
 *
 * Deliberately the whole table, and deliberately not named anything like
 * getMyCertificates. The read policy hands an organiser every row and a
 * student only their own, so the owner filter that function applies by hand
 * is the thing keeping its name true; this one has no owner to narrow to and
 * must never be called from a student-facing page.
 *
 * Oldest first because that is the order the queue is worked in. The two
 * settled lists are reversed on the page rather than read again: one query
 * against a table this size beats three, and the counts printed above the
 * lists have to be counted from the same rows they describe or they will
 * quietly disagree with each other.
 *
 * The joins need no view behind them. The admin read policy already returns
 * every certificate row to an organiser and profiles_read_self lets them read
 * any profile, so a view here would be a second copy of a rule Postgres is
 * already applying, kept in step by hand.
 */
export const getCertificatesForReview = cache(async (): Promise<CertificateForOrganiser[]> => {
  const supabase = await createClient();

  const { data } = await supabase
    .from("certificates")
    .select(
      `*,
       owner:profiles!certificates_owner_id_fkey(id, full_name, email, prn, student_class),
       verifier:profiles!certificates_verified_by_fkey(id, full_name)`,
    )
    .order("created_at", { ascending: true });

  return (data ?? []) as unknown as CertificateForOrganiser[];
});

/**
 * Which of three states a certificate is in.
 *
 * The table carries one boolean and an organiser has three things to say, so
 * the third is read off `verified_at` rather than stored in a column of its
 * own: a row nobody has opened yet has no stamp on it, and a row somebody
 * looked at and turned down has one. reviewCertificate in
 * src/app/actions/admin.ts writes the other half of this, and the long
 * comment there is the argument for doing it this way.
 *
 * It lives next to the read rather than on the page because the CSV export
 * has to name the same three states in the same words, and two copies would
 * drift apart the first time one of them was reworded.
 */
export type CertificateState = "waiting" | "verified" | "turned down";

export function certificateState(certificate: Certificate): CertificateState {
  if (certificate.verified) return "verified";
  return certificate.verified_at ? "turned down" : "waiting";
}
