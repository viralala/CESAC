import type { Metadata } from "next";

import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { EventsExplorer } from "@/components/blocks/events-explorer";
import { EventCard } from "@/components/blocks/event-card";
import { Reveal } from "@/components/ui/reveal";
import { getPastEvents, getUpcomingEvents } from "@/lib/data/events";

export const metadata: Metadata = {
  title: "Events",
  description: "Upcoming and past CESAC events: outreach programs, workshops, seminars and more.",
};

export default function EventsPage() {
  const upcoming = getUpcomingEvents();
  const past = getPastEvents();

  return (
    <>
      <PageHeader
        eyebrow="Events"
        title="Everything on the calendar"
        description="Filter by category to find what you're looking for. Registration for each event happens through the student portal."
      />

      <Section>
        <EventsExplorer events={upcoming} />
      </Section>

      {past.length > 0 ? (
        <Section tone="paper" className="border-t border-line">
          <div className="flex flex-col gap-10">
            <SectionHeading tone="light" eyebrow="Archive" title="Past events" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((event, i) => (
                <Reveal key={event.slug} delay={Math.min(i, 6) * 0.05}>
                  <EventCard event={event} />
                </Reveal>
              ))}
            </div>
          </div>
        </Section>
      ) : null}
    </>
  );
}
