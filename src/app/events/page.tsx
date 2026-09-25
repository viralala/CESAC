import type { Metadata } from "next";
import Link from "next/link";

import { Arrow, Container } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import { PageHead } from "@/components/sections/page-head";
import { EventWhen } from "@/components/site/event-when";
import { SiteFooter } from "@/components/site/footer";
import { EVENTS } from "@/lib/data/cesac";
import { getSchedules, scheduleFor } from "@/lib/data/event-schedule";
import { badgeFor, getEventBadges } from "@/lib/data/event-status";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Competitions, workshops and department activities run by CESAC, the Computer Engineering Student Activities Committee at VIT Pune.",
  alternates: { canonical: "/events" },
};

/**
 * The index lists exactly what has been supplied. A calendar with one entry is
 * the honest state of a committee page early in a cycle, and padding it with
 * invented past events would be the one thing the brief rules out hardest.
 */
export default async function EventsPage() {
  const [badges, schedules] = await Promise.all([getEventBadges(), getSchedules()]);

  return (
    <>
      <PageHead
        kicker="Events"
        title="What we run"
        lede="Everything CESAC is running or has announced. New events appear here as they are confirmed."
      />

      <section className="bg-cream pb-20 pt-4 sm:pb-24">
        <Container>
          <div className="grid gap-3">
            {EVENTS.map((e, i) => {
              const badge = badgeFor(e, badges);

              return (
                <Reveal key={e.slug} delay={i * 70}>
                  {/* The whole card still opens the event, through the
                      title's link stretched over it. It is not one big link
                      any more because the calendar menu sits inside it, and
                      a link inside a link is not a thing a browser allows. */}
                  <article className="card group relative flex flex-wrap items-center gap-x-10 gap-y-6 p-7 transition-transform duration-300 hover:-translate-y-1 sm:p-9">
                    <div className="min-w-[min(100%,22rem)] flex-1">
                      <span
                        className="label-sm inline-flex rounded-full px-3.5 py-1.5"
                        style={{ background: badge.bg, color: badge.fg }}
                      >
                        {badge.label}
                      </span>
                      <h2 className="d-tall mt-5 text-[clamp(2rem,5vw,3.2rem)] text-ink">
                        <Link href={e.href} className="after:absolute after:inset-0 after:content-['']">
                          {e.name}
                        </Link>
                      </h2>
                      <p className="jp mt-1 text-[1rem] text-teal">{e.jp}</p>
                      <p className="mt-4 max-w-[52ch] text-[0.9375rem] leading-relaxed text-ink/75">
                        {e.blurb}
                      </p>
                      <p className="label-sm mt-6 text-muted">{e.when}</p>
                      <EventWhen
                        event={e}
                        schedule={scheduleFor(e, schedules)}
                        showDate={false}
                        className="relative z-10 mt-5"
                      />
                    </div>
                    <span aria-hidden className="dot-btn ml-auto">
                      <Arrow />
                    </span>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </section>

      <SiteFooter />
    </>
  );
}
