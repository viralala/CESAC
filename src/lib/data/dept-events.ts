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

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const people = "id, full_name, email";

  const { data } = await supabase
    .from("event_registrations")
    .select(
      `*,
       student:profiles!event_registrations_student_id_fkey(${people}),
       partner:profiles!event_registrations_partner_id_fkey(${people})`,
    )
    .or(`student_id.eq.${user.id},partner_id.eq.${user.id}`)
    .eq("status", "registered");

  return (data ?? []) as MyRegistration[];
});
