import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { EVENTS, type CesacEvent } from "@/lib/data/cesac";

export type Badge = { label: string; bg: string; fg: string };

/**
 * The badge on an event card, in one place.
 *
 * The home page and the events index both carry it and both had their own
 * copy of this map, which was survivable while the only values came from a
 * hand-written `status` in cesac.ts and nothing ever changed them.
 */
const BADGE: Record<string, Badge> = {
  open: { label: "Registration open", bg: "var(--lime)", fg: "var(--ink)" },
  announced: { label: "Announced", bg: "var(--azure)", fg: "var(--ink)" },
  past: { label: "Wrapped", bg: "var(--cream-3)", fg: "var(--ink)" },
  closed: { label: "Entries closed", bg: "var(--cream-3)", fg: "var(--ink)" },
};

/**
 * What the database says each event's entries are doing.
 *
 * Read through `dept_event_states()` rather than off the table, because the
 * table is closed to signed-out visitors and should stay closed: it carries
 * `updated_by`, which is an organiser's user id. The function returns the
 * slug and the state and nothing else.
 *
 * An empty map on failure, deliberately. Every caller falls back to the
 * hand-written status, so a database that cannot be reached costs the badge
 * its liveness and nothing else. A public page must not go down because a
 * label could not be looked up.
 */
const liveStates = cache(async (): Promise<Map<string, string>> => {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("dept_event_states");
    if (error || !data) return new Map();
    return new Map(data.map((row) => [row.slug, row.state]));
  } catch {
    return new Map();
  }
});

/**
 * The badge for every event, keyed by slug.
 *
 * The written status is the fallback and the database is the override, which
 * is the right way round for exactly one reason: `locked` is the state every
 * event sits in for most of its life, and it does not mean the same thing as
 * "not announced". An event can be announced for weeks before entries open.
 * So `locked` defers to whatever the page has been written to say, and only
 * `open` and `closed`, which are facts about a form that either works or does
 * not, override it.
 *
 * Before this existed the badge was written by hand, and it said "Announced"
 * on both public pages for as long as it took somebody to notice that
 * registration for Attack on Token had opened.
 */
export const getEventBadges = cache(async (): Promise<Record<string, Badge>> => {
  const live = await liveStates();
  const out: Record<string, Badge> = {};

  for (const event of EVENTS) {
    const state = live.get(event.slug);
    const key = state === "open" || state === "closed" ? state : event.status;
    out[event.slug] = BADGE[key] ?? BADGE.announced;
  }

  return out;
});

/** For a caller holding one event and the map. Never returns undefined. */
export function badgeFor(event: CesacEvent, badges: Record<string, Badge>): Badge {
  return badges[event.slug] ?? BADGE[event.status] ?? BADGE.announced;
}
