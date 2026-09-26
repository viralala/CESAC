import type { Metadata } from "next";

import { SiteFooter } from "@/components/site/footer";
import { WhenBand } from "@/components/sections/event/when-band";
import { HrfbAgenda } from "@/components/sections/hr-final-boss/agenda";
import { HrfbAsk } from "@/components/sections/hr-final-boss/ask";
import { HrfbBoss } from "@/components/sections/hr-final-boss/boss";
import { HrfbClosing } from "@/components/sections/hr-final-boss/closing";
import { HrfbHero } from "@/components/sections/hr-final-boss/hero";
import { HrfbLinkedIn } from "@/components/sections/hr-final-boss/linkedin";
import { HrfbVitals } from "@/components/sections/hr-final-boss/vitals";
import { getHrfbContent } from "@/lib/data/event-content";

export const metadata: Metadata = {
  title: "HR Final Boss",
  description:
    "CESAC's free speaker session: an interactive HR and technical Q&A with a speaker of 30+ years' HR experience, based in Africa. Name withheld until announced.",
  alternates: { canonical: "/events/hr-final-boss" },
};

/**
 * One decision per screen, same order the Attack on Token page uses: what is
 * this, can I come, who is speaking (as much as that can say right now),
 * what can I ask, how does the room run, where else to find it, what to do
 * next. No production plan here either, same rule as the other event page.
 */
export default async function HrFinalBossPage() {
  const { linkedin } = await getHrfbContent();

  return (
    <>
      <HrfbHero />
      <HrfbVitals />
      <WhenBand slug="hr-final-boss" ground="grid-box" />
      <HrfbBoss />
      <HrfbAsk />
      <HrfbAgenda />
      <HrfbLinkedIn linkedin={linkedin} />
      <HrfbClosing />
      <SiteFooter />
    </>
  );
}
