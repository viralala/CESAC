import type { Metadata } from "next";

import { EventBoard } from "@/components/console/event-board";
import { Panel } from "@/components/console/shell";
import { requireParticipant } from "@/lib/auth/guard";
import { getDeptEvents, getMyRegistrations } from "@/lib/data/dept-events";
import { getSchedules } from "@/lib/data/event-schedule";

export const metadata: Metadata = {
  title: "Events",
  robots: { index: false, follow: false },
};

/**
 * What the department is running, and the one decision a student makes about
 * each of them.
 *
 * Deliberately not an event page. There are no rounds here, no schedule, no
 * rules and no run of the show: those belong on the event's own page, which is
 * written for somebody deciding whether to enter. Repeating them in a portal
 * would make a second copy that disagrees with the first inside a fortnight,
 * and a student reading the wrong one on the day is the department's problem
 * rather than theirs.
 */
export default async function EventsPage() {
  const viewer = await requireParticipant();

  const [events, registrations, schedules] = await Promise.all([
    getDeptEvents(),
    getMyRegistrations(),
    getSchedules(),
  ]);

  const anyOpen = events.some((event) => event.state === "open");

  return (
    <Panel
      eyebrow="Calendar"
      title="Events"
      aside={anyOpen ? undefined : "Nothing taking entries"}
    >
      <p className="serif-it -mt-1 mb-6 text-[1.02rem] leading-relaxed text-muted">
        Everything the committee runs is listed here, and you choose what to enter. Entries open
        one event at a time, so most of this list is locked most of the year.
      </p>

      <EventBoard
        events={events}
        registrations={registrations}
        meId={viewer.id}
        schedules={Object.fromEntries(schedules)}
      />
    </Panel>
  );
}
