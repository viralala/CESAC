import type { Metadata } from "next";

import { setPoints } from "@/app/actions/console-content";
import { ActionForm } from "@/components/console/action-form";
import { Empty, Notice, Panel } from "@/components/console/shell";
import { requireAdmin } from "@/lib/auth/guard";
import { requireCap } from "@/lib/auth/caps";
import { getScale } from "@/lib/data/site";

export const metadata: Metadata = {
  title: "Points",
  robots: { index: false, follow: false },
};

const BANDS = [
  {
    band: "contribution",
    title: "A hackathon or competition",
    note: "What the student came away with. One of these is the base for every event record.",
  },
  {
    band: "extracurricular",
    title: "A non-technical or extracurricular activity",
    note: "What the student came away with. Its own scale, separate from a hackathon's.",
  },
  {
    band: "kind",
    title: "A publication",
    note: "A paper does not place, so its base is the kind of publication it is.",
  },
  {
    band: "level",
    title: "How far it reached",
    note: "Added on top of whichever base applies, for every kind of record alike.",
  },
] as const;

/**
 * What a record is worth.
 *
 * Participation was ten points against a first prize's hundred until today,
 * which reads as "turning up is a rounding error" and is the opposite of what
 * a board meant to move people to enter things should say. It is forty now,
 * and the level is added on top, so a national hackathon somebody entered and
 * did not place in scores seventy rather than ten.
 *
 * Nothing is stored against a record, so a number changed here re-scores every
 * record in the department on the next request. That is said out loud at the
 * top of the page, because it is not what a form usually does.
 */
export default async function PointsPage() {
  await requireAdmin();
  await requireCap("content");

  const scale = await getScale();

  const example = (base: string, level: string) => {
    const b = scale.find((s) => s.key === base)?.points ?? 0;
    const l = scale.find((s) => s.key === level)?.points ?? 0;
    return { b, l, total: b + l };
  };

  const nationalParticipation = example("contribution:participation", "level:national");
  const internationalFirst = example("contribution:first", "level:international");
  const nationalJournal = example("kind:journal", "level:national");
  const stateExtracurricular = example("extracurricular:participation", "level:state");

  return (
    <>
      <Panel eyebrow="Before you change one" title="What a number here does">
        <Notice tone="error">
          Changing a number re-scores every record in the department at once, including old ones.
        </Notice>

        <p className="serif-it mt-6 text-[1rem] leading-relaxed text-muted">
          A record scores a base for its result or kind of publication plus a level, as in these
          examples:
        </p>

        <dl className="mt-5 grid gap-2.5">
          {[
            {
              k: "A national hackathon they entered and did not place in",
              v: nationalParticipation,
            },
            { k: "First prize at an international hackathon", v: internationalFirst },
            { k: "A journal paper at national level", v: nationalJournal },
            {
              k: "A state-level extracurricular activity they entered and did not place in",
              v: stateExtracurricular,
            },
          ].map((row) => (
            <div
              key={row.k}
              className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 rounded-[var(--r-md)] bg-cream-2 px-5 py-3.5"
            >
              <dt className="text-[0.98rem] text-ink">{row.k}</dt>
              <dd className="label text-teal">
                {row.v.b} + {row.v.l} = {row.v.total}
              </dd>
            </div>
          ))}
        </dl>
      </Panel>

      {scale.length === 0 ? (
        <Panel eyebrow="Scale" title="Nothing to edit">
          <Empty>
            The scale could not be read here, though the board is still scoring from it.
          </Empty>
        </Panel>
      ) : null}

      {BANDS.map((band) => {
        const rows = scale.filter((s) => s.band === band.band);
        if (!rows.length) return null;

        return (
          <Panel key={band.band} eyebrow="Scale" title={band.title} aside={band.note}>
            <ul className="grid gap-2.5">
              {rows.map((row) => (
                <li key={row.key} className="rounded-[var(--r-md)] bg-cream-2 px-5 py-4">
                  <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                    <div className="min-w-0 flex-1">
                      <p className="label text-ink">{row.label}</p>
                      {row.hint ? (
                        <p className="serif-it mt-1 text-[0.88rem] leading-relaxed text-muted">
                          {row.hint}
                        </p>
                      ) : null}
                      <p className="label-sm mt-1.5 font-mono text-muted">{row.key}</p>
                    </div>

                    <ActionForm
                      action={setPoints}
                      submit="Save"
                      tone="ghost"
                      className="flex items-end gap-3"
                    >
                      <input type="hidden" name="key" value={row.key} />
                      <span>
                        <label
                          htmlFor={`p-${row.key}`}
                          className="label-sm block text-muted"
                        >
                          {band.band === "level" ? "Added" : "Base"}
                        </label>
                        <input
                          id={`p-${row.key}`}
                          name="points"
                          type="number"
                          min={0}
                          max={10000}
                          step={1}
                          required
                          defaultValue={row.points}
                          className="field mt-1.5 w-28"
                        />
                      </span>
                    </ActionForm>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        );
      })}
    </>
  );
}
