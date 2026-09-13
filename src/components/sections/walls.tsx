import { WallBand } from "@/components/aot/art";
import { Container, Label, SectionHead } from "@/components/aot/bits";
import { Meter } from "@/components/aot/meter";
import { Reveal } from "@/components/aot/reveal";
import { Seal } from "@/components/aot/seal";
import { CHAPTERS } from "@/lib/data/event";

const WHY_IT_WORKS = [
  {
    title: "Scalable",
    body: "Chapter III is deliberately capped at 8 finalist teams, keeping mentors, judges and the physical chit market staffable.",
  },
  {
    title: "Motivating",
    body: "Round-level awards preserve the value of Chapter I and Chapter II performance even when a team does not advance.",
  },
  {
    title: "Narrative",
    body: "Each chapter changes the skill being tested, so the event feels like an escalation rather than three disconnected tasks.",
  },
];

/**
 * The Crypko board's shell: a cream frame wrapped around a deep coloured panel,
 * with a notched tab cutting into the top edge and the rotating seal inside.
 */
export function Walls() {
  return (
    <section className="bg-cream py-10 sm:py-16">
      <Container>
        <Reveal>
          <div className="shell">
            <div className="shell-inner washi-teal grain grain-dark relative px-6 py-14 text-cream sm:px-10 sm:py-16 lg:px-14">
              {/* notched tab, as on the Crypko panel */}
              <span className="label absolute left-6 top-0 rounded-b-[var(--r-md)] bg-cream-2 px-5 py-2.5 text-teal sm:left-10">
                Progression funnel
              </span>

              <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-start">
                <SectionHead
                  tone="dark"
                  eyebrow="Fifty teams enter"
                  title={
                    <>
                      Three walls.
                      <br />
                      One breach.
                    </>
                  }
                  lede="Manga pacing meets competition design: broad entry, sharp filtering, high-touch finale."
                  className="mt-6"
                />
                <Seal
                  className="mt-6 hidden w-[150px] text-cream/85 lg:block"
                  text="VISION FORGE · TOKEN TRIALS · FUSION AWAKENING · "
                  center={
                    <>
                      50
                      <br />
                      Teams
                    </>
                  }
                />
              </div>

              <div className="mt-14 grid gap-4 lg:grid-cols-3">
                {CHAPTERS.map((c, i) => (
                  <Reveal key={c.id} delay={i * 110}>
                    <a
                      href={`#${c.id}`}
                      className="group relative flex h-full flex-col overflow-hidden rounded-[var(--r-lg)] bg-teal-2/70 p-7 transition-colors hover:bg-teal-2"
                    >
                      <WallBand className="absolute inset-x-0 bottom-0 h-20 text-cream/10" />

                      <div className="relative flex items-start justify-between gap-4">
                        <div>
                          <Label tone="light">
                            {c.wall} · Chapter {c.numeral}
                          </Label>
                          <h3 className="d-tall mt-3 text-[2.4rem] text-cream">{c.title}</h3>
                          <p className="jp mt-1 text-sm text-cream/40">{c.jp}</p>
                        </div>
                        <span className="d-wide text-[2.75rem] leading-none text-red">
                          {c.index}
                        </span>
                      </div>

                      <p className="serif-it relative mt-5 max-w-[38ch] text-[1rem] leading-relaxed text-cream/70">
                        {c.blurb}
                      </p>

                      <div className="relative mt-9 grid grid-cols-2 gap-4 border-t border-cream/15 pt-5">
                        <div>
                          <Label tone="light">Teams</Label>
                          <p className="d-wide mt-2 text-3xl text-cream">{c.from}</p>
                        </div>
                        <div>
                          <Label tone="light">Advances</Label>
                          <p className="d-wide mt-2 text-3xl text-red-soft">{c.advances}</p>
                        </div>
                      </div>
                    </a>
                  </Reveal>
                ))}
              </div>

              <div className="mt-14 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                <div>
                  <Label tone="light">Why the funnel works</Label>
                  <dl className="mt-6 grid gap-6 sm:grid-cols-3 lg:grid-cols-1">
                    {WHY_IT_WORKS.map((w, i) => (
                      <Reveal key={w.title} delay={i * 80}>
                        <div className="border-l-2 border-red pl-5">
                          <dt className="d-tall text-xl text-cream">{w.title}</dt>
                          <dd className="mt-2 max-w-[50ch] text-sm leading-relaxed text-cream/65">
                            {w.body}
                          </dd>
                        </div>
                      </Reveal>
                    ))}
                  </dl>
                </div>

                <Reveal delay={80}>
                  <div className="rounded-[var(--r-lg)] bg-cream p-7 text-ink">
                    <Label>Overall champion weighting</Label>
                    <div className="mt-6 grid gap-5">
                      {CHAPTERS.map((c, i) => (
                        <Meter key={c.id} label={c.title} pct={c.weight} delay={i * 120} />
                      ))}
                    </div>
                    <p className="serif-it mt-7 border-t border-ink/10 pt-5 text-[0.95rem] leading-relaxed text-muted">
                      Cumulative weighted score decides the Champion. Each chapter still carries its
                      own standalone award.
                    </p>
                  </div>
                </Reveal>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
