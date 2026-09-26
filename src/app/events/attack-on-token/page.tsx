import type { Metadata, Viewport } from "next";

import { SiteFooter } from "@/components/site/footer";
import { EventChapters } from "@/components/sections/event/chapters";
import { EventHero } from "@/components/sections/event/hero";
import { EventPrizes } from "@/components/sections/event/prizes";
import { EventRegister } from "@/components/sections/event/register";
import { RegisterStrip } from "@/components/sections/event/register-button";
import { EventVitals } from "@/components/sections/event/vitals";
import { WhenBand } from "@/components/sections/event/when-band";
import { Ribbon } from "@/components/sections/ribbon";
import { getAotContent } from "@/lib/data/event-content";

export const metadata: Metadata = {
  title: "Attack on Token",
  description:
    "Three chapters. One battlefield. Attack on Token is CESAC's prompt engineering hackathon at VIT Pune: Vision Forge, the Token Trials and Fusion Awakening.",
  alternates: { canonical: "/events/attack-on-token" },
};

// The site-wide theme colour is teal (see the root layout); this route runs
// the sponsorship deck's own system, so the browser chrome matches that.
export const viewport: Viewport = {
  themeColor: "#141110",
};


/**
 * One decision per screen, in the order a prospective team makes them:
 * what is this, can we enter, what are the three rounds, what do we win,
 * how do we sign up.
 *
 * A reader makes up their mind at different points, so the way in is offered
 * at each of them rather than only at the bottom: after the four vitals, after
 * the chapters, and after the prizes, with the full panel last. They are all
 * the same button to the same form, and the strips are one line each, so the
 * repetition costs a scroll rather than a second pitch.
 *
 * The production plan (staffing, AV, grading pipeline, pre-launch gates) is
 * internal and is deliberately not here.
 */
export default async function AttackOnTokenPage() {
  const { event, chapters, register, strips } = await getAotContent();
  const words = [event.name, event.jp, ...chapters.map((c) => c.title)].filter(Boolean);

  return (
    <>
      <EventHero event={event} formUrl={register.formUrl} />
      <EventVitals />
      <WhenBand slug="attack-on-token" ground="bg-cream" />
      <RegisterStrip line={strips.one} formUrl={register.formUrl} />
      <section className="bg-cream py-6 sm:py-10">
        <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8">
          <div className="mx-auto w-full max-w-[720px]">
            <Ribbon items={words} tone="teal" />
          </div>
        </div>
      </section>
      <EventChapters />
      <RegisterStrip line={strips.two} formUrl={register.formUrl} />
      <EventPrizes />
      <RegisterStrip line={strips.three} formUrl={register.formUrl} />
      <EventRegister />
      <SiteFooter />
    </>
  );
}
