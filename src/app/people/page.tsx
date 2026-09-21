import type { Metadata } from "next";

import { PageHead } from "@/components/sections/page-head";
import { Roster } from "@/components/sections/roster";
import { SiteFooter } from "@/components/site/footer";
import { getCopy, getRoster, rosterTotal } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "People",
  description:
    "Everyone on the CESAC committee: faculty leadership, student leadership, the board of executives, associate executives and the four verticals.",
  alternates: { canonical: "/people" },
};

/**
 * The roster.
 *
 * Both the names and the words around them come from the database, so a
 * correction is a form on the console rather than a commit. The count in the
 * lede is counted from the rows being rendered rather than stored anywhere: a
 * number that has to be remembered when somebody joins is a number that will
 * be wrong within a month.
 */
export default async function PeoplePage() {
  const [groups, t] = await Promise.all([getRoster(), getCopy()]);

  return (
    <>
      <PageHead
        kicker={t("people.kicker")}
        title={t("people.title")}
        lede={t("people.lede", { total: rosterTotal(groups) })}
      />
      <Roster groups={groups} />
      <SiteFooter />
    </>
  );
}
