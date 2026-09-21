import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type DeptEvent = Tables<"dept_events">;
export type Registration = Tables<"event_registrations">;

/**
 * Every event the department runs, in the order the committee put them.
 *
 * Deliberately thin. There is a name, a line and a date on this table and
 * nothing else: no rounds, no schedule, no brief. Those live on the event's
 * own public page, written for somebody deciding whether to enter, and
 * repeating them beside a student's PRN would make the console a second
 * source of truth that drifts.
 */
export const getDeptEvents = cache(async (): Promise<DeptEvent[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("dept_events")
    .select("*")
    .order("position")
    .order("name");
  return data ?? [];
});

export type Person = Pick<Tables<"profiles">, "id" | "full_name" | "email">;

/**
 * What an organiser sees of a student, which is more than a student sees of
 * their own partner. Deliberately a separate type: widening Person would have
 * handed every student their partner's PRN and class as a side effect of the
 * console needing them, and profiles_read_self allows that read, so nothing
 * would have stopped it.
 */
export type PersonForOrganiser = Person & Pick<Tables<"profiles">, "prn" | "student_class">;

export type MyRegistration = Registration & {
  /** The one who signed the pair up. Themselves, for a solo entry. */
  student: Person | null;
  partner: Person | null;
};

/**
 * What the signed-in student has entered, either as the one who signed up or
 * as the partner somebody named.
 *
 * Both people come back with names attached, which profiles_read_self allows
 * for exactly this pair and nobody else.
 */
export const getMyRegistrations = cache(async (): Promise<MyRegistration[]> => {
  const supabase = await createClient();

  // getClaims rather than getUser. See the note in lib/auth/guard.ts.
  const { data: verified } = await supabase.auth.getClaims();
  const userId = verified?.claims?.sub;
  if (!userId) return [];

  const people = "id, full_name, email";

  const { data } = await supabase
    .from("event_registrations")
    .select(
      `*,
       student:profiles!event_registrations_student_id_fkey(${people}),
       partner:profiles!event_registrations_partner_id_fkey(${people})`,
    )
    .or(`student_id.eq.${userId},partner_id.eq.${userId}`)
    .eq("status", "registered");

  return (data ?? []) as MyRegistration[];
});

export type Entry = Registration & {
  student: PersonForOrganiser | null;
  partner: PersonForOrganiser | null;
  verifier: Pick<Tables<"profiles">, "id" | "full_name"> | null;
};

/**
 * Every entry for every event, for the organiser console.
 *
 * Read straight off the table rather than through a view: the admin policy
 * on event_registrations already returns everything to an organiser and
 * nothing to a student, and profiles_read_self lets an organiser read any
 * profile, so the join needs no help. A view here would be a second copy of
 * a rule Postgres already holds.
 *
 * PRN and class come along because an organiser checking somebody in at a
 * desk has a class list in front of them and a name is not enough to find a
 * row in it.
 */
export const getEventEntries = cache(async (): Promise<Entry[]> => {
  const supabase = await createClient();

  const people = "id, full_name, email, prn, student_class";

  const { data } = await supabase
    .from("event_registrations")
    .select(
      `*,
       student:profiles!event_registrations_student_id_fkey(${people}),
       partner:profiles!event_registrations_partner_id_fkey(${people}),
       verifier:profiles!event_registrations_verified_by_fkey(id, full_name)`,
    )
    .order("created_at", { ascending: false });

  return (data ?? []) as unknown as Entry[];
});
