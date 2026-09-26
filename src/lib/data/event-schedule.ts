import "server-only";

import { cache } from "react";

import { EVENTS, type CesacEvent, type EventSchedule } from "@/lib/data/cesac";
import { publicSchedules } from "@/lib/data/public-cache";

/**
 * When each event is, keyed by slug.
 *
 * The committee sets the dates from the Entries page, into `dept_events`,
 * and `event_schedule()` hands them to signed-out visitors without opening
 * the table. For an event the database knows, its answer is the answer,
 * including "no date": an organiser clearing a date that moved has to put the
 * page back to "to be announced", not bring back the one written in the code.
 * Only when the database cannot be asked, or does not know the event, is the
 * date in lib/data/cesac.ts used, the same way the badges fall back.
 */
export const getSchedules = cache(async (): Promise<Map<string, EventSchedule | null>> => {
  const out = new Map<string, EventSchedule | null>(EVENTS.map((e) => [e.slug, e.schedule]));

  try {
    // The same for every visitor, so read once a minute for all of them.
    const data = await publicSchedules();

    for (const row of data) {
      out.set(
        row.slug,
        row.starts_at
          ? {
              start: row.starts_at,
              end: row.ends_at ?? null,
              allDay: Boolean(row.all_day),
              venue: row.venue ?? null,
            }
          : null,
      );
    }
  } catch {
    // A public page must not go down because a date could not be looked up.
  }

  return out;
});

export function scheduleFor(
  event: Pick<CesacEvent, "slug" | "schedule">,
  schedules: Map<string, EventSchedule | null>,
): EventSchedule | null {
  return schedules.has(event.slug) ? (schedules.get(event.slug) ?? null) : event.schedule;
}
