import type { Metadata, Viewport } from "next";

import { SiteFooter } from "@/components/site/footer";
import { EventChapters } from "@/components/sections/event/chapters";
import { EventHero } from "@/components/sections/event/hero";
import { EventPrizes } from "@/components/sections/event/prizes";
import { EventRegister } from "@/components/sections/event/register";
import { RegisterStrip } from "@/components/sections/event/register-button";
import { EventVitals } from "@/components/sections/event/vitals";
import { Ribbon } from "@/components/sections/ribbon";
import { EVENT } from "@/lib/data/event";

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

const WORDS = [
  EVENT.name,
  EVENT.jp,
  "Vision Forge",
  "Token Trials",
  "Fusion Awakening",
] as const;

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
export default function AttackOnTokenPage() {
  return (
    <>
      <EventHero />
      <EventVitals />
      <RegisterStrip line="Two people, ₹125, one form. That is the whole of getting in." />
      <section className="bg-cream py-6 sm:py-10">
        <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8">
          <div className="mx-auto w-full max-w-[720px]">
            <Ribbon items={WORDS} tone="teal" />
          </div>
        </div>
      </section>
      <EventChapters />
      <RegisterStrip line="Three chapters, and every team starts at the first one." />
      <EventPrizes />
      <RegisterStrip line="Six awards, 80 teams, and entries close when the last seat goes." />
      <EventRegister />
      <SiteFooter />
    </>
  );
}
