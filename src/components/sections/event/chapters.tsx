import { Container, Label } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import { Seal } from "@/components/aot/seal";
import { Sticker } from "@/components/aot/stickers";
import { type Chapter, type Pop } from "@/lib/data/event";
import { getAotContent } from "@/lib/data/event-content";

const POP: Record<Pop, string> = {
  azure: "var(--azure)",
  violet: "var(--violet)",
  lime: "var(--lime)",
  pink: "var(--pink)",
};

/** Pops are light or dark; the label on top has to know which. */
const ON_POP: Record<Pop, string> = {
  azure: "var(--ink)",
  violet: "var(--white)",
  lime: "var(--ink)",
  pink: "var(--white)",
};

/**
 * The cut, drawn rather than described.
 *
 * Four bars, heights proportional to the field that survives each chapter.
 * The old page said "broad entry, sharp filtering, high-touch finale" in a
 * sentence; this says it in a shape you read in under a second.
 */
const HEIGHTS = [100, 54, 30, 14, 8, 5, 3];

/** Teams in, and teams out of each chapter, from the chapters themselves. */
function Funnel({ chapters }: { chapters: readonly Chapter[] }) {
  const stages = [
    {
      n: chapters[0]?.from ?? "",
      label: "Enter",
      h: HEIGHTS[0],
      fill: "rgba(245,241,231,0.22)",
      fg: "var(--cream)",
    },
    ...chapters.map((c, i) => ({
      n: c.to,
      label: i === chapters.length - 1 ? "Champion" : `After ${c.numeral}`,
      h: HEIGHTS[i + 1] ?? 3,
      fill: POP[c.pop],
      fg: ON_POP[c.pop],
    })),
  ];
  const said = [
    `${stages[0].n} teams enter`,
    ...chapters.map((c, i) =>
      i === chapters.length - 1 ? `${c.to} after the last` : `${c.to} advance after Chapter ${c.numeral}`,
    ),
  ].join(", ");

  return (
    <div className="flex items-end gap-2 sm:gap-4" role="img" aria-label={`${said}.`}>
      {stages.map((s, i) => (
        <div key={s.label} className="flex flex-1 items-end gap-2 sm:gap-4">
          <div className="flex-1">
            <p
              className="d-wide mb-2 text-[clamp(1.6rem,4vw,2.9rem)] leading-none"
              style={{ color: i === 0 ? "var(--cream)" : s.fill }}
            >
              {s.n}
            </p>
            <div
              className="w-full rounded-t-[var(--r-sm)] rounded-b-[4px] transition-[height] duration-700"
              style={{ background: s.fill, height: `${(s.h / 100) * 148 + 14}px` }}
            />
            <p className="label-sm mt-3 text-cream/55">{s.label}</p>
          </div>
          {i < stages.length - 1 ? (
            <span aria-hidden className="mb-14 hidden text-cream/30 sm:block">
              <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/** Scoring weight as one stacked bar rather than three paragraphs. */
function WeightBar({ chapters }: { chapters: readonly Chapter[] }) {
  return (
    <div>
      <Label tone="light">Champion score</Label>
      <div className="mt-4 flex h-5 w-full overflow-hidden rounded-full">
        {chapters.map((c) => (
          <span
            key={c.id}
            className="h-full"
            style={{ width: `${c.weight}%`, background: POP[c.pop] }}
          />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        {chapters.map((c) => (
          <span key={c.id} className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-1.5 w-5 rounded-full"
              style={{ background: POP[c.pop] }}
            />
            <span className="label-sm text-cream/75">
              {c.numeral} · {c.weight}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

const COUNT = ["No", "One", "Two", "Three", "Four", "Five", "Six"];

export async function EventChapters() {
  const { chapters } = await getAotContent();
  const entering = chapters[0]?.from ?? "";

  return (
    <section id="chapters" className="scroll-mt-24 bg-cream py-10 sm:py-16">
      <Container>
        <Reveal>
          <div className="shell relative">
            <Sticker
              shape="burst"
              pop="pink"
              rotate={12}
              float={0.4}
              size="clamp(4.6rem,7vw,5.8rem)"
              className="absolute -right-2 -top-4 z-40 text-[clamp(0.64rem,0.95vw,0.78rem)] sm:-right-4 sm:-top-6"
            >
              <span>
                Live
                <br />
                <span className="opacity-85">board</span>
              </span>
            </Sticker>

            <div className="shell-inner washi-red-deep grain grain-dark relative px-6 py-14 text-cream sm:px-10 sm:py-16 lg:px-14">
              {/* the notched tab */}
              <span className="label absolute left-6 top-0 rounded-b-[var(--r-md)] bg-cream-2 px-5 py-2.5 text-teal sm:left-10">
                Progression funnel
              </span>

              <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-start">
                <div className="mt-6">
                  <Label tone="lime">{entering} teams enter</Label>
                  <h2 className="d-tall mt-4 text-[clamp(2.6rem,7vw,5.25rem)] text-cream">
                    {COUNT[chapters.length] ?? chapters.length} walls.
                    <br />
                    One breach.
                  </h2>
                </div>
                <Seal
                  className="mt-6 hidden w-[140px] text-cream/80 lg:block"
                  text={`${chapters.map((c) => c.title.toUpperCase()).join(" · ")} · `}
                  center={
                    <>
                      {entering}
                      <br />
                      Teams
                    </>
                  }
                />
              </div>

              <div className="mt-12 grid gap-12 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
                <Funnel chapters={chapters} />
                <WeightBar chapters={chapters} />
              </div>

              {/* the three chapters */}
              <div className="mt-16 grid gap-4 lg:grid-cols-3">
                {chapters.map((c, i) => (
                  <Reveal key={c.id} delay={i * 110}>
                    <article
                      id={c.id}
                      className="flex h-full scroll-mt-24 flex-col rounded-[var(--r-lg)] bg-cream p-7 text-ink"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <span
                          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[0.95rem] font-extrabold tracking-[0.08em]"
                          style={{ background: POP[c.pop], color: ON_POP[c.pop] }}
                        >
                          {c.numeral}
                        </span>
                        <span className="d-wide text-[2.6rem] leading-none text-ink/12">
                          {c.index}
                        </span>
                      </div>

                      <h3 className="d-tall mt-5 text-[2.1rem] text-ink">{c.title}</h3>
                      <p className="jp mt-1 text-sm text-muted">{c.jp}</p>

                      <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink/75">{c.task}</p>

                      <dl className="mt-auto grid gap-2 pt-7">
                        <div className="flex items-baseline gap-3">
                          <dt className="label-sm w-[4.5rem] shrink-0 text-muted">Hand in</dt>
                          <dd className="text-[0.875rem] font-semibold text-ink">{c.deliver}</dd>
                        </div>
                        <div className="flex items-baseline gap-3">
                          <dt className="label-sm w-[4.5rem] shrink-0 text-muted">Setup</dt>
                          <dd className="text-[0.875rem] text-muted">{c.tools}</dd>
                        </div>
                      </dl>

                      <p
                        className="label mt-6 border-t-2 pt-5"
                        style={{ borderColor: POP[c.pop], color: "var(--teal)" }}
                      >
                        {c.from} teams → {c.to}
                      </p>
                    </article>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
