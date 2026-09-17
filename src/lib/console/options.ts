import type { Enums } from "@/lib/supabase/database.types";

/**
 * The fixed lists the console offers, and the words it offers them in.
 *
 * Plain constants, in a file that touches neither the database nor the
 * browser, because both sides need them: the form renders the options and the
 * server action checks what came back against the same list. Keeping them
 * here is what stops a client component from importing a server-only data
 * module, or a non-async constant from a "use server" file, to get at them.
 *
 * The values are the database's. The labels are ours.
 */

export type Contribution = Enums<"certificate_contribution">;

/**
 * What a student came away with from an event.
 *
 * What each one is worth is the database's business: certificate_points() is
 * the single rule, and the ranking is built from it. SCALE below restates
 * those numbers for the reader; if the two ever disagree, the database is
 * right and SCALE is a bug.
 */
export const CONTRIBUTIONS: readonly { value: Contribution; label: string }[] = [
  { value: "participation", label: "Participation" },
  { value: "third", label: "Third prize" },
  { value: "second", label: "Second prize" },
  { value: "first", label: "First prize" },
];

export const CONTRIBUTION_LABEL: Record<string, string> = Object.fromEntries(
  CONTRIBUTIONS.map((c) => [c.value, c.label]),
);

/** Printed so a student can work out their own total rather than trust ours. */
export const SCALE = [
  { label: "First prize", points: 100 },
  { label: "Second prize", points: 75 },
  { label: "Third prize", points: 50 },
  { label: "Participation", points: 10 },
] as const;

/** What a question can be about. The database stores the slug. */
export const TOPICS = [
  { value: "certificates", label: "Certificates" },
  { value: "events", label: "Events and entries" },
  { value: "payments", label: "Payments" },
  { value: "student-data", label: "My details" },
  { value: "account", label: "Signing in" },
  { value: "other", label: "Something else" },
] as const;

export const TOPIC_LABEL: Record<string, string> = Object.fromEntries(
  TOPICS.map((t) => [t.value, t.label]),
);

/** Indian grouping, because a prize is read aloud in lakhs and not millions. */
export function rupees(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}
