import type { Metadata } from "next";
import Link from "next/link";

import { Arrow, Container } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import { PageHead } from "@/components/sections/page-head";
import { SiteFooter } from "@/components/site/footer";
import { EVENTS } from "@/lib/data/cesac";
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
  const badges = await getEventBadges();

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
                  <Link
                    href={e.href}
                    className="card group flex flex-wrap items-center gap-x-10 gap-y-6 p-7 transition-transform duration-300 hover:-translate-y-1 sm:p-9"
                  >
                    <div className="min-w-[min(100%,22rem)] flex-1">
                      <span
                        className="label-sm inline-flex rounded-full px-3.5 py-1.5"
                        style={{ background: badge.bg, color: badge.fg }}
                      >
                        {badge.label}
                      </span>
                      <h2 className="d-tall mt-5 text-[clamp(2rem,5vw,3.2rem)] text-ink">{e.name}</h2>
                      <p className="jp mt-1 text-[1rem] text-teal">{e.jp}</p>
                      <p className="mt-4 max-w-[52ch] text-[0.9375rem] leading-relaxed text-ink/75">
                        {e.blurb}
                      </p>
                      <p className="label-sm mt-6 text-muted">{e.when}</p>
                    </div>
                    <span className="dot-btn ml-auto">
                      <Arrow />
                    </span>
                  </Link>
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
