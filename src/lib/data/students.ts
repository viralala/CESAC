import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

/**
 * What the directory shows of a student.
 *
 * A separate type for the same reason PersonForOrganiser in dept-events.ts is
 * one: profiles_read_self lets an organiser read any profile, so nothing in
 * the database would stop a student-facing shape that had quietly grown a PRN
 * on it from being filled in on a student-facing page. Keeping the organiser's
 * columns in their own type means a page has to ask for them by name.
 *
 * The whole row is not selected either. Phone, college and the Drive folder id
 * are all on profiles and none of them help anybody find a student, so they
 * stay in the database rather than being printed on a screen that will be open
 * on a laptop at a desk.
 */
export type StudentForOrganiser = Pick<
  Tables<"profiles">,
  "id" | "full_name" | "email" | "prn" | "student_class" | "role" | "must_change_password"
>;

/** One page of results. Enough to scan, short enough to read. */
export const PAGE_SIZE = 25;

export type StudentSearch = {
  rows: StudentForOrganiser[];
  /** Everything that matched, not just what fits on this page. */
  total: number;
  page: number;
  pages: number;
  pageSize: number;
  /** What was actually searched for, after the syntax was taken out of it. */
  term: string;
};

function nothingFound(term: string, page: number): StudentSearch {
  return { rows: [], total: 0, page, pages: 0, pageSize: PAGE_SIZE, term };
}

/**
 * What is safe to put inside a PostgREST `or` expression.
 *
 * The filter travels as `or=(full_name.ilike.%x%,email.ilike.%x%,...)`, where
 * the comma separates one condition from the next and the brackets close the
 * group. A student's name contains neither, but a search box does not get to
 * assume that: typing one would be writing filter syntax rather than searching
 * for it, and the query would come back as an error or, worse, as the wrong
 * rows. They are removed rather than escaped, because PostgREST's escape is a
 * quoted value with its own rules about backslashes and nobody is looking for
 * a bracket.
 *
 * The wildcards go for a different reason. ilike already wraps the term in `%`
 * at both ends, so a bare `*` or `%` left in would match every account in the
 * table and read like a search that had found the entire college.
 *
 * Apostrophes deliberately stay. This is a query parameter and not SQL, so
 * there is nothing to inject, and stripping them would stop O'Brien matching
 * O'Brien.
 */
function termFor(raw: string): string {
  return raw
    .replace(/[,()"\\%*]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Find a student, in the database rather than in the browser.
 *
 * There are more accounts on this site than anybody wants to scroll, and every
 * one of them carries a real name, a real address and a real PRN. Sending the
 * lot to the browser and filtering it there would put the whole roster in the
 * page source of every search, so the term goes to Postgres and one page of
 * matches comes back. The count rides along on the same query, so the page can
 * say how many matched without asking a second time.
 *
 * An empty term returns nothing and asks Postgres nothing. A directory that
 * opens on the first twenty-five students is a list of real people printed for
 * no reason.
 *
 * The match is one substring, case insensitive, against the four things an
 * organiser has to hand: a name, an address, a PRN or a class. It does not
 * care about word order, so a surname, part of an address or a class code will
 * find somebody and a name typed back to front will not.
 */
export const searchStudents = cache(async (raw: string, page = 1): Promise<StudentSearch> => {
  const term = termFor(raw);
  const wanted = Number.isFinite(page) && page >= 1 ? Math.floor(page) : 1;
  if (!term) return nothingFound(term, 1);

  const supabase = await createClient();
  const pattern = `%${term}%`;
  const from = (wanted - 1) * PAGE_SIZE;

  const { data, count, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, prn, student_class, role, must_change_password", {
      count: "exact",
    })
    .or(
      [
        `full_name.ilike.${pattern}`,
        `email.ilike.${pattern}`,
        `prn.ilike.${pattern}`,
        `student_class.ilike.${pattern}`,
      ].join(","),
    )
    // Ordered the same way every time, because the pager offsets into this
    // list: two rows that tied under an unstable sort would swap places
    // between page one and page two, and one of them would never be seen.
    .order("full_name", { nullsFirst: false })
    .order("email")
    .range(from, from + PAGE_SIZE - 1);

  // A search that fails says it found nothing rather than taking the console
  // down with it. The counts above it are still worth reading.
  if (error) return nothingFound(term, wanted);

  const total = count ?? 0;
  return {
    rows: data ?? [],
    total,
    page: wanted,
    pages: Math.ceil(total / PAGE_SIZE),
    pageSize: PAGE_SIZE,
    term,
  };
});

export type PasswordHold = {
  /** Every account, whatever it is and however it was made. */
  accounts: number;
  /** Still holding the password it was imported with. */
  waiting: number;
  /** No longer held at the change-password screen. */
  released: number;
};

/**
 * How many accounts are still holding the password they were imported with.
 *
 * The roster import gave each account the student's own email address as its
 * password, and guard.ts holds that account at the change-password screen
 * until it is replaced. must_change_password is the record of it, and this is
 * the count that says whether that window is still open.
 *
 * Counted at request time, and counted by Postgres rather than here: `head`
 * asks for the count and no rows at all, so the number arrives without the
 * roster coming with it.
 *
 * `released` is a subtraction and not a column of its own. It is every account
 * not currently held, which is very nearly every student who has chosen a
 * password and not quite: an account made through Google, or made before the
 * check existed, was never held in the first place. The flag records that an
 * account is waiting, not where its password came from, so the page says that
 * rather than claim a precision the data does not have.
 */
export const getPasswordHold = cache(async (): Promise<PasswordHold> => {
  const supabase = await createClient();

  const [all, held] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("must_change_password", true),
  ]);

  const accounts = all.count ?? 0;
  const waiting = held.count ?? 0;

  return { accounts, waiting, released: Math.max(accounts - waiting, 0) };
});
