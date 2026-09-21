import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

/**
 * The areas of the console an organiser may write in.
 *
 * Until today an organiser was either everything or nothing, and a committee
 * of seven all held everything. A capability names one area; an organiser with
 * no grant row in the database holds all of them, which is what made this safe
 * to switch on under a live committee.
 *
 * **This file is a menu, not a lock.** Every capability is checked again by
 * Postgres: `admin_can()` guards each `admin_*` function and each write
 * policy, so a request crafted by hand is refused there whatever the console
 * chose to render. What these do is stop somebody being shown a page whose
 * every button will fail.
 */
export const CAPS = [
  {
    value: "events",
    label: "Events and entries",
    note: "Open and close events, edit them, verify entries, score chapters, apply the cut.",
  },
  {
    value: "payments",
    label: "Payments",
    note: "Verify an entry fee, send one back, mark a team paid at the desk.",
  },
  {
    value: "records",
    label: "Student records",
    note: "Check certificates and publications, turn one down, delete one, export the lot.",
  },
  { value: "queries", label: "Questions", note: "Answer what students ask on their console." },
  {
    value: "people",
    label: "People and access",
    note: "The student directory, who is an organiser, and what each organiser can reach.",
  },
  {
    value: "content",
    label: "Site content",
    note: "The roster, the words on the public pages, the points scale, the front page showcase.",
  },
  {
    value: "settings",
    label: "Event controls",
    note: "Registration, the leaderboard, the fee, the UPI details and the announcement.",
  },
] as const;

export type Cap = (typeof CAPS)[number]["value"];

export const CAP_LABEL: Record<string, string> = Object.fromEntries(
  CAPS.map((c) => [c.value, c.label]),
);

/**
 * What this organiser holds, asked of the database once per request.
 *
 * Falls back to nothing rather than to everything. A read that fails should
 * hide controls, not offer them: the write behind each one would be refused
 * anyway, and a console full of buttons that all error is worse than one that
 * says the area is not yours.
 */
export const getMyCaps = cache(async (): Promise<string[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_admin_caps");

  if (error || !Array.isArray(data)) return [];
  return data as string[];
});

export async function can(cap: Cap): Promise<boolean> {
  return (await getMyCaps()).includes(cap);
}

/**
 * Turn an organiser away from a page they hold nothing on.
 *
 * Back to the command page rather than to a wall, because somebody following a
 * link from a colleague should land somewhere useful and not on an error. The
 * command page itself has no capability and shows everyone what they can do.
 */
export async function requireCap(cap: Cap): Promise<void> {
  if (!(await can(cap))) redirect("/admin?denied=" + cap);
}
