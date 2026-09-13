import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, Users } from "lucide-react";

import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Badge } from "@/components/ui/badge";
import { SampleTag } from "@/components/ui/sample-tag";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { LinkButton } from "@/components/ui/button";
import { EventCard } from "@/components/blocks/event-card";
import { formatDateRange } from "@/lib/format";
import { EVENT_CATEGORY_LABEL } from "@/lib/data/types";
import { getAllEvents, getEventBySlug } from "@/lib/data/events";

export function generateStaticParams() {
  return getAllEvents().map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = getEventBySlug(slug);
  if (!event) return {};
  return {
    title: event.title,
    description: event.summary,
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = getEventBySlug(slug);
  if (!event) notFound();

  const related = getAllEvents()
    .filter((item) => item.slug !== event.slug && item.category === event.category)
    .slice(0, 3);

  return (
    <>
      <div className="border-b border-line bg-ink-2/40 pb-14 pt-10">
        <Container className="flex flex-col gap-8">
          <Link
            href="/events"
            className="inline-flex w-fit items-center gap-2 font-mono text-xs uppercase tracking-wider text-fg-muted hover:text-fg"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Back to events
          </Link>

          <div className="grid gap-10 lg:grid-cols-12">
            <div className="flex flex-col gap-6 lg:col-span-7">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="solid">{EVENT_CATEGORY_LABEL[event.category]}</Badge>
                <SampleTag />
              </div>
              <h1 className="text-balance font-display text-4xl font-medium leading-[1.05] text-fg sm:text-5xl">
                {event.title}
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-fg-muted">{event.summary}</p>
            </div>
            <div className="flex flex-col gap-3 border-t border-line pt-6 font-mono text-xs uppercase tracking-wide text-fg-muted lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <div className="flex items-center justify-between gap-4 border-b border-line pb-3">
                <span className="flex items-center gap-2">
                  <CalendarDays className="size-3.5" aria-hidden /> When
                </span>
                <span className="text-right text-fg">{formatDateRange(event.startDate, event.endDate)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-line pb-3">
                <span className="flex items-center gap-2">
                  <MapPin className="size-3.5" aria-hidden /> Venue
                </span>
                <span className="text-right text-fg">{event.venue}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2">
                  <Users className="size-3.5" aria-hidden /> Capacity
                </span>
                <span className="text-right text-fg">{event.capacity} slots</span>
              </div>
              <LinkButton href="/login" variant="primary" size="lg" className="mt-4">
                Register via portal
              </LinkButton>
            </div>
          </div>
        </Container>
      </div>

      <Section>
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <ImagePlaceholder pattern={event.pattern} className="aspect-video w-full" />
          </div>
          <div className="flex flex-col gap-4 lg:col-span-5">
            <h2 className="font-display text-2xl font-medium text-fg">About this event</h2>
            <p className="text-base leading-relaxed text-fg-muted">{event.description}</p>
          </div>
        </div>
      </Section>

      {related.length > 0 ? (
        <Section tone="paper" className="border-t border-line">
          <div className="flex flex-col gap-10">
            <SectionHeading tone="light" eyebrow="Related" title="More in this category" />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <EventCard key={item.slug} event={item} />
              ))}
            </div>
          </div>
        </Section>
      ) : null}
    </>
  );
}
