import type { Metadata } from "next";

import { Panel } from "@/components/console/shell";
import { PointsScale, RankingTable, StandingSummary } from "@/components/console/standing";
import { requireParticipant } from "@/lib/auth/guard";
import { getCopy, getScale } from "@/lib/data/site";
import { getMyStanding, getRankingBoard } from "@/lib/data/student";

export const metadata: Metadata = {
  title: "Ranking",
  robots: { index: false, follow: false },
};

/**
 * The department board.
 *
 * Built from what students have uploaded, which is worth saying out loud on
 * the page: it counts certificates, not merit, and a certificate nobody has
 * checked yet still counts. The honest version of that is printed underneath
 * the table rather than left for somebody to find out.
 *
 * A student can only read their own profile, so the names here come from a
 * database function written for the purpose. It hands back a name, a year and
 * two counts, and nothing else: no address, no phone, no PRN.
 */
export default async function RankingPage() {
  const viewer = await requireParticipant();

  const [standing, board, scale, t] = await Promise.all([
    getMyStanding(),
    getRankingBoard(10),
    getScale(),
    getCopy(),
  ]);

  return (
    <div className="grid gap-6">
      <Panel eyebrow="Standing" title="Where you rank">
        <StandingSummary standing={standing} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-start">
        <Panel
          eyebrow="The department"
          title="Top ten"
          aside={board.length ? `${board.length} shown` : undefined}
        >
          <RankingTable rows={board} meId={viewer.id} />

          <p className="serif-it mt-6 border-t border-ink/10 pt-5 text-[0.95rem] leading-relaxed text-muted">
            {t("console.ranking.note")}
          </p>
        </Panel>

        <Panel eyebrow="How it counts" title="Points">
          <PointsScale scale={scale} />
        </Panel>
      </div>
    </div>
  );
}
