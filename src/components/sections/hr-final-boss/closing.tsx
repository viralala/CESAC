import Link from "next/link";

import { Container } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import { getHrfbContent } from "@/lib/data/event-content";

/**
 * The close. No registration link, because there is no registration: entry
 * is free and nothing is open yet. So this states what is actually true
 * (free, TBA, watch this space) instead of inviting anyone into a form that
 * does not exist.
 */
export async function HrfbClosing() {
  const { event } = await getHrfbContent();

  return (
    <section className="grid-box-deep py-16 sm:py-24">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-[var(--r-xl)] border-2 border-hb-maya/20 px-7 py-14 sm:px-12 sm:py-16">
            <p className="label-sm text-hb-maya">No fee. No form. Not yet.</p>
            <h2 className="hb-display mt-5 max-w-[16ch] text-[clamp(2.6rem,7vw,5rem)] uppercase leading-[0.92] text-hb-ghost">
              Entry is free.
              <br />
              The date is not.
            </h2>
            <p className="mt-6 max-w-[54ch] text-[1.05rem] leading-relaxed text-hb-ghost/70">
              {event.dateVenue}. There is no registration open yet, so there is nothing to sign up
              for today. Check back here, or watch CESAC&rsquo;s other channels, once it is
              confirmed.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/events"
                className="rounded-full bg-hb-maya px-7 py-3.5 text-[0.9rem] font-bold text-hb-ink transition-transform hover:-translate-y-0.5"
              >
                Back to all events
              </Link>
              <a
                href="#boss-file"
                className="rounded-full border-2 border-hb-ghost/30 px-7 py-3.5 text-[0.9rem] font-bold text-hb-ghost transition-colors hover:bg-hb-ghost/10"
              >
                Re-read the boss file
              </a>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
