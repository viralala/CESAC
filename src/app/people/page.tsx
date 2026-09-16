import type { Metadata } from "next";

import { PageHead } from "@/components/sections/page-head";
import { Roster } from "@/components/sections/roster";
import { SiteFooter } from "@/components/site/footer";
import { TEAM_TOTAL } from "@/lib/data/committee";

export const metadata: Metadata = {
  title: "People",
  description:
    "Everyone on the CESAC committee: faculty leadership, student leadership, the board of executives, associate executives and the four verticals.",
  alternates: { canonical: "/people" },
};

export default function PeoplePage() {
  return (
    <>
      <PageHead
        kicker="People"
        title="The roster"
        lede={`All ${TEAM_TOTAL} of us: faculty leadership, student leadership, the board of executives, associate executives and the four verticals that carry the work.`}
      />
      <Roster />
      <SiteFooter />
    </>
  );
}
