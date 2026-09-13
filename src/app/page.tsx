import { ArrowUpRight } from "lucide-react";

import { Hero } from "@/components/blocks/hero";
import { FeaturedEventCard } from "@/components/blocks/featured-event-card";
import { EventCard } from "@/components/blocks/event-card";
import { PersonCard } from "@/components/blocks/person-card";
import { GalleryTile } from "@/components/blocks/gallery-tile";
import { CTABlock } from "@/components/blocks/cta-block";
import { ScrollStory, type StoryChapter } from "@/components/blocks/scroll-story";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Reveal } from "@/components/ui/reveal";
import { LinkButton } from "@/components/ui/button";
import { getFeaturedEvent, getUpcomingEvents } from "@/lib/data/events";
import { TEAM } from "@/lib/data/people";
import { getAllGalleryItems } from "@/lib/data/gallery";

const STORY_CHAPTERS: StoryChapter[] = [
  {
    index: "01",
    label: "How it works",
    title: "Committees plan the programs",
    body: "Each program starts with a committee: outreach, workshops, seminars or socials. They handle logistics, partners and scheduling before anything is published here.",
  },
  {
    index: "02",
    label: "How it works",
    title: "Events open on the portal",
    body: "Once a program is ready, it is published as an event with a date, venue and capacity. Students register and track their status through the student portal.",
  },
  {
    index: "03",
    label: "How it works",
    title: "Participation is kept on record",
    body: "After an event, attendance is confirmed and certificates are issued. Announcements keep everyone posted on what comes next.",
  },
];

export default function Home() {
  const featuredEvent = getFeaturedEvent();
  const upcomingEvents = getUpcomingEvents().filter((event) => event.slug !== featuredEvent.slug).slice(0, 3);
  const previewTeam = TEAM.filter((member) => member.group === "core").slice(0, 4);
  const previewGallery = getAllGalleryItems().slice(0, 4);

  return (
    <>
      <Hero />

      <Section>
        <div className="flex flex-col gap-10">
          <SectionHeading
            eyebrow="Featured"
            title="This term's featured event"
            description="One program to know about right now. See the rest of what's coming up below."
          />
          <Reveal>
            <FeaturedEventCard event={featuredEvent} />
          </Reveal>
        </div>
      </Section>

      <Section className="border-t border-line">
        <div className="flex flex-col gap-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading eyebrow="Calendar" title="Upcoming events" />
            <LinkButton href="/events" variant="ghost">
              View all events
              <ArrowUpRight className="size-4" aria-hidden />
            </LinkButton>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((event, i) => (
              <Reveal key={event.slug} delay={i * 0.08}>
                <EventCard event={event} />
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      <Section tone="paper">
        <div className="flex flex-col gap-14">
          <SectionHeading
            eyebrow="CESAC, in three steps"
            title="From committee plan to your certificate"
            tone="light"
            description="How a CESAC program moves from planning to something on your record."
          />
          <ScrollStory chapters={STORY_CHAPTERS} />
        </div>
      </Section>

      <Section className="border-t border-line">
        <div className="flex flex-col gap-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading eyebrow="People" title="Who runs CESAC" />
            <LinkButton href="/people" variant="ghost">
              Meet the full team
              <ArrowUpRight className="size-4" aria-hidden />
            </LinkButton>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {previewTeam.map((member, i) => (
              <Reveal key={member.slug} delay={i * 0.06}>
                <PersonCard member={member} />
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      <Section className="border-t border-line">
        <div className="flex flex-col gap-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionHeading eyebrow="Moments" title="From past programs" />
            <LinkButton href="/moments" variant="ghost">
              Open the full gallery
              <ArrowUpRight className="size-4" aria-hidden />
            </LinkButton>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {previewGallery.map((item, i) => (
              <Reveal key={item.id} delay={i * 0.05}>
                <GalleryTile item={item} />
              </Reveal>
            ))}
          </div>
        </div>
      </Section>

      <Section className="border-t border-line">
        <CTABlock
          eyebrow="Get involved"
          title="Ready to join the next program?"
          description="Create a student portal account to register for events, and check the announcements page for what's currently open."
          primary={{ href: "/login", label: "Enter the portal" }}
          secondary={{ href: "/contact", label: "Ask a question" }}
        />
      </Section>
    </>
  );
}
