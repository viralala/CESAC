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
 * What each one is worth is the database's business, and since 21 September
 * 2026 it is a row in `public.scoring` that the committee edits from the
 * console rather than a number in this file. There used to be a SCALE constant
 * here restating them; it was deleted rather than kept in step, because a
 * console printing 10 for participation while the board awards 40 is worse
 * than one that has to ask the database. `getScale()` in lib/data/site.ts is
 * the read.
 *
 * A publication has no place, so these apply to events only. The five record
 * layouts are in ./records.ts.
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

/**
 * The replies an organiser reaches for over and over.
 *
 * In the week after a roster announcement the questions desk gets the same
 * handful of questions a few hundred times, and typing the same paragraph out
 * again every time is how one rule drifts into six slightly different
 * versions of itself. These are the one version.
 *
 * They are a convenience for the person answering and nothing more. The
 * button drops the text into the answer box, the organiser reads it over and
 * usually edits it, and what is sent is whatever ends up in the box. So there
 * is deliberately no check against this list on the server and no table
 * behind it: a canned answer is a starting point, not a category, and storing
 * it as one would mean a migration and a screen to maintain the rows.
 *
 * Every one of these describes how the site behaves today. Check that is
 * still true before adding to the list.
 */
export const CANNED_ANSWERS: readonly { label: string; text: string }[] = [
  {
    label: "Record counted",
    text: "Thanks for uploading it. It is on your record and the ranking already counts it, so there is nothing further for you to do.",
  },
  {
    label: "Publications go here too",
    text: "Journal papers, conference papers, books and book chapters all go on the same page as your certificates. Pick what kind of thing it is at the top of the form and it will ask for what that kind needs. A publication does not need a file attached to it.",
  },
  {
    label: "Fee being checked",
    text: "We have the reference you recorded and an organiser is checking it against the account. Your entry stands while that happens, so please do not pay a second time.",
  },
  {
    label: "Reference did not match",
    text: "We could not match the reference you recorded against the account. Your entry is still in. Open your events page, record the correct reference, and we will check it again.",
  },
  {
    label: "Entries not open yet",
    text: "That event is not taking entries yet. The entry form appears on your events page the moment the committee opens it, so there is nothing for you to fill in before then.",
  },
  {
    label: "Wrong partner named",
    text: "We can withdraw that entry so both of you are free to enter again with the right partner. Reply here to confirm, and the record of what was paid is kept either way.",
  },
  {
    label: "Email is not self-editable",
    text: "Your name, class, PRN and mobile number can all be corrected from your profile page. The email address is the one thing you cannot change yourself, because it is what the account signs in with. Tell us the correct address here and an organiser will change it for you.",
  },
  {
    label: "First sign-in",
    text: "Your account was made for you from the department roster, and its first password is your own college email address. You are asked to set a real password the first time you sign in. If that is not working, tell us the exact address you are typing and we will look.",
  },
];

/** Indian grouping, because a prize is read aloud in lakhs and not millions. */
export function rupees(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}
