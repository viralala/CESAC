import Link from "next/link";

import { Chip, Empty, Stat } from "@/components/console/shell";
import { SCALE, rupees } from "@/lib/console/options";
import type { BoardRow, Standing } from "@/lib/data/student";

/**
 * Where the student stands.
 *
 * Nothing is invented for an empty record. A student who has uploaded nothing
 * has no position, and is told so along with what to do about it, rather than
 * being shown a number that would read as last place.
 */
export function StandingSummary({ standing }: { standing: Standing | null }) {
  if (!standing) {
    return (
      <Empty>
        You are not on the board yet. Add a certificate to your record and a position appears
        here, worked out from what you have uploaded.
      </Empty>
    );
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          value={`#${standing.place}`}
          label="Position"
          note={`of ${standing.rankedStudents} on the board`}
        />
        <Stat value={standing.points} label="Points" />
        <Stat
          value={standing.certificates}
          label={standing.certificates === 1 ? "Certificate" : "Certificates"}
          note={standing.prizeTotalInr > 0 ? `${rupees(standing.prizeTotalInr)} won` : undefined}
        />
      </div>

      <p className="serif-it mt-6 text-[0.95rem] leading-relaxed text-muted">
        Only students who have uploaded something are counted, so the board grows as the
        department fills it in. Ties are broken by the number of certificates, then alphabetically.
      </p>
    </>
  );
}

/** The top of the board. Names only, and only for people who have uploaded. */
export function RankingTable({ rows, meId }: { rows: BoardRow[]; meId: string }) {
  if (rows.length === 0) {
    return (
      <Empty>
        Nobody has uploaded a certificate yet. The first person to add one is the first person on
        the board.
      </Empty>
    );
  }

  return (
    <ol className="grid gap-0">
      {rows.map((row) => {
        const isMe = row.studentId === meId;
        return (
          <li
            key={row.studentId}
            className={`flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1.5 border-b border-ink/10 py-3.5 last:border-0 ${
              isMe ? "-mx-3 rounded-[var(--r-md)] bg-teal/[0.07] px-3" : ""
            }`}
          >
            <span className="flex min-w-0 items-baseline gap-4">
              <span className="d-tall w-[2.6rem] shrink-0 text-[1.3rem] leading-none text-teal">
                {row.place}
              </span>
              <span className="min-w-0">
                <span className="block text-[1.02rem] text-ink">{row.name}</span>
                <span className="label-sm block text-muted">
                  {row.year ? `${row.year} ` : ""}
                  {row.certificates} {row.certificates === 1 ? "certificate" : "certificates"}
                </span>
              </span>
            </span>
            <span className="flex items-center gap-3">
              {isMe ? <Chip tone="teal">You</Chip> : null}
              <span className="label text-ink">{row.points}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** The scale, said plainly, with the way to move up it. */
export function PointsScale() {
  return (
    <>
      <dl className="grid gap-0">
        {SCALE.map((step) => (
          <div
            key={step.label}
            className="flex items-baseline justify-between gap-6 border-b border-ink/10 py-3 last:border-0"
          >
            <dt className="label text-muted">{step.label}</dt>
            <dd className="d-tall text-[1.2rem] text-ink">{step.points}</dd>
          </div>
        ))}
      </dl>

      <p className="serif-it mt-6 text-[0.95rem] leading-relaxed text-muted">
        Every certificate on your record counts, from any event, not only ours. Add them on your{" "}
        <Link href="/dashboard/certificates" className="text-teal hover:underline">
          certificates page
        </Link>
        .
      </p>
    </>
  );
}
