import Link from "next/link";
import type { ReactNode } from "react";

import { Chip, Empty, Stat } from "@/components/console/shell";
import { Avatar } from "@/components/site/avatar";
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
        Only students who have uploaded something are counted, and no two students ever share a
        place.
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
            className={`flex flex-wrap items-center justify-between gap-x-6 gap-y-1.5 border-b border-ink/10 py-3.5 last:border-0 ${
              isMe ? "-mx-3 rounded-[var(--r-md)] bg-teal/[0.07] px-3" : ""
            }`}
          >
            <span className="flex min-w-0 items-center gap-4">
              <span className="d-tall w-[2.6rem] shrink-0 text-[1.3rem] leading-none text-teal">
                {row.place}
              </span>
              <Avatar key={row.photo ?? "none"} name={row.name} sources={[row.photo]} size={40} />
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
 * As tables, because a score is the sum of two things and a table says so
 * at a glance: a base for what you came away with, or for the kind of record
 * it is, and a level added on top for how far it reached.
 */
export function PointsScale({ scale, wide = false }: { scale: ScaleRow[]; wide?: boolean }) {
  if (scale.length === 0) {
    return (
      <Empty>
        The points scale could not be read just now. Your standing above is still worked out from
        it, so nothing on the board has changed.
      </Empty>
    );
  }

  const points = new Map(scale.map((s) => [s.key, s.points]));
  const placed = PLACED_BANDS.filter((b) => scale.some((s) => s.band === b.band));
  const flat = scale.filter((s) => s.band === "kind").sort((a, b) => a.position - b.position);
  const levels = scale.filter((s) => s.band === "level").sort((a, b) => a.position - b.position);

  return (
    <>
      <div className={`grid gap-8 ${wide ? "xl:grid-cols-[1.5fr_1fr_1fr]" : ""}`}>
        {placed.length ? (
          <ScaleTable caption="Records that place" note="What you came away with.">
            <thead>
              <tr>
                <Th>Record</Th>
                {RESULTS.map((r) => (
                  <Th key={r.key} end>
                    {r.label}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {placed.map((band) => (
                <tr key={band.band}>
                  <Td>{band.title}</Td>
                  {RESULTS.map((r) => (
                    <Td key={r.key} end strong>
                      {points.get(`${band.band}:${r.key}`) ?? "–"}
                    </Td>
                  ))}
                </tr>
              ))}
            </tbody>
          </ScaleTable>
        ) : null}

        {flat.length ? (
          <ScaleTable caption="Records that do not place" note="One base for the kind of record.">
            <thead>
              <tr>
                <Th>Record</Th>
                <Th end>Points</Th>
              </tr>
            </thead>
            <tbody>
              {flat.map((row) => (
                <tr key={row.key}>
                  <Td>{row.label}</Td>
                  <Td end strong>
                    {row.points}
                  </Td>
                </tr>
              ))}
            </tbody>
          </ScaleTable>
        ) : null}

        {levels.length ? (
          <ScaleTable caption="Added for how far it reached" note="On top of either base.">
            <thead>
              <tr>
                <Th>Level</Th>
                <Th end>Added</Th>
              </tr>
            </thead>
            <tbody>
              {levels.map((row) => (
                <tr key={row.key}>
                  <Td>{row.label}</Td>
                  <Td end strong>
                    +{row.points}
                  </Td>
                </tr>
              ))}
            </tbody>
          </ScaleTable>
        ) : null}
      </div>

      <p className="serif-it mt-7 border-t border-ink/10 pt-5 text-[0.95rem] leading-relaxed text-muted">
        Internships and online courses score their base alone, and everything on your record
        counts, so add it all on your{" "}
        <Link href="/dashboard/certificates" className="text-teal hover:underline">
          record page
        </Link>
        .
      </p>
    </>
  );
}

/** The three scales that place, by the band their rows are keyed under. */
const PLACED_BANDS = [
  { band: "contribution", title: "Hackathon" },
  { band: "competition", title: "Competition" },
  { band: "extracurricular", title: "Non-technical or extracurricular" },
] as const;

const RESULTS = [
  { key: "participation", label: "Took part" },
  { key: "third", label: "Third" },
  { key: "second", label: "Second" },
  { key: "first", label: "First" },
] as const;

function ScaleTable({
  caption,
  note,
  children,
}: {
  caption: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="label text-ink">{caption}</p>
      <p className="serif-it mt-1 text-[0.85rem] leading-snug text-muted">{note}</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-left">{children}</table>
      </div>
    </div>
  );
}

function Th({ children, end = false }: { children: ReactNode; end?: boolean }) {
  return (
    <th
      scope="col"
      className={`label-sm border-b-2 border-ink/15 px-2 py-2 font-normal text-muted first:pl-0 last:pr-0 ${
        end ? "text-right" : ""
      }`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  end = false,
  strong = false,
}: {
  children: ReactNode;
  end?: boolean;
  strong?: boolean;
}) {
  return (
    <td
      className={`border-b border-ink/10 px-2 py-2.5 first:pl-0 last:pr-0 ${end ? "text-right" : ""} ${
        strong ? "d-tall text-[1.1rem] text-ink" : "text-[0.95rem] text-ink/85"
      }`}
    >
      {children}
    </td>
  );
}
