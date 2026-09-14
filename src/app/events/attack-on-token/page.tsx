import type { Metadata } from "next";

import { SiteFooter } from "@/components/site/footer";
import { EventChapters } from "@/components/sections/event/chapters";
import { EventEnlist } from "@/components/sections/event/enlist";
import { EventHero } from "@/components/sections/event/hero";
import { EventPrizes } from "@/components/sections/event/prizes";
import { EventVitals } from "@/components/sections/event/vitals";
import { Ribbon } from "@/components/sections/ribbon";
import { EVENT } from "@/lib/data/event";

export const metadata: Metadata = {
  title: "Attack on Token",
  description:
    "Three chapters. One battlefield. Attack on Token is CESAC's prompt engineering hackathon at VIT Pune: Vision Forge, the Token Trials and Fusion Awakening.",
  alternates: { canonical: "/events/attack-on-token" },
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
 * The production plan (staffing, AV, grading pipeline, pre-launch gates) is
 * internal and is deliberately not here.
 */
export default function AttackOnTokenPage() {
  return (
    <>
      <EventHero />
      <EventVitals />
      <section className="bg-cream py-6 sm:py-10">
        <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8">
          <div className="mx-auto w-full max-w-[720px]">
            <Ribbon items={WORDS} tone="teal" />
          </div>
        </div>
      </section>
      <EventChapters />
      <EventPrizes />
      <EventEnlist />
      <SiteFooter />
    </>
  );
}
