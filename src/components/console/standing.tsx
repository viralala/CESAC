import Link from "next/link";

import { Chip, Empty, Stat } from "@/components/console/shell";
import { rupees } from "@/lib/console/options";
import type { ScaleRow } from "@/lib/data/site";
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

/**
 * The scale, said plainly, with the way to move up it.
 *
 * The numbers are read from the same table the database scores with, and are
 * passed in rather than fetched here so this stays a plain component. There is
 * deliberately no hard-coded copy of them anywhere: a panel printing 10 for
 * participation while the board awards 40 is a console lying to a student
 * about their own total.
 *
 * Two bands, because a score is the sum of two things. What you came away with
 * (or what kind of publication it is) and how far it reached.
 */
export function PointsScale({ scale }: { scale: ScaleRow[] }) {
  const bands: { band: string; title: string; note: string }[] = [
    {
      band: "contribution",
      title: "A hackathon or competition",
      note: "What you came away with.",
    },
    { band: "kind", title: "A publication", note: "What kind of thing it is." },
    { band: "level", title: "Added for how far it reached", note: "On top of either of the above." },
  ];

  if (scale.length === 0) {
    return (
      <Empty>
        The points scale could not be read just now. Your standing above is still worked out from
        it, so nothing on the board has changed.
      </Empty>
    );
  }

  return (
    <>
      {bands.map((band) => {
        const rows = scale.filter((s) => s.band === band.band);
        if (!rows.length) return null;

        return (
          <div key={band.band} className="mt-6 first:mt-0">
            <p className="label text-ink">{band.title}</p>
            <p className="serif-it mt-1 text-[0.85rem] leading-snug text-muted">{band.note}</p>
            <dl className="mt-3 grid gap-0">
              {rows.map((step) => (
                <div
                  key={step.key}
                  className="flex items-baseline justify-between gap-6 border-b border-ink/10 py-2.5 last:border-0"
                >
                  <dt className="label text-muted">{step.label}</dt>
                  <dd className="d-tall text-[1.15rem] text-ink">
                    {step.band === "level" ? `+${step.points}` : step.points}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        );
      })}

      <p className="serif-it mt-7 border-t border-ink/10 pt-5 text-[0.95rem] leading-relaxed text-muted">
        Everything on your record counts, from any event or journal, not only ours. Add them on
        your{" "}
        <Link href="/dashboard/certificates" className="text-teal hover:underline">
          record page
        </Link>
        .
      </p>
    </>
  );
}
