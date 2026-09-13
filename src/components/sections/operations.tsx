import { GradientStrip } from "@/components/aot/art";
import { Container, Label, SectionHead } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import { FORMAT, RESOURCES } from "@/lib/data/event";

const GATES = [
  "Lock dates / venue / eligibility",
  "Finalize Chapter II challenge + hidden tests",
  "Provision Chapter I tools + load test",
  "Dry-run grading pipeline",
  "Confirm prize pool",
  "Print chit decks / trade cards",
  "Brief judges + open paid registration",
];

/** Yonika's near-black panel, closed with its gradient strip. */
export function Operations() {
  return (
    <section id="operations" className="scroll-mt-24 bg-cream py-10 sm:py-16">
      <Container>
        <Reveal>
          <div className="washi-dark grain grain-dark relative overflow-hidden rounded-[var(--r-xl)] px-6 pt-16 text-cream sm:px-10 lg:px-14">
            <SectionHead
              tone="dark"
              align="center"
              eyebrow="Operations / master schedule"
              title={
                <>
                  Built to run,
                  <br />
                  not just look good
                </>
              }
              lede="The production system behind the spectacle — a two-day format, a staffed finale and a pre-launch checklist that has to clear before registration opens."
            />

            <div className="mt-14 grid gap-4 lg:grid-cols-2">
              {FORMAT.map((f, i) => (
                <Reveal key={f.day} delay={i * 90}>
                  <div className="h-full rounded-[var(--r-lg)] bg-ink-2 p-8">
                    <p className="d-wide text-[2.75rem] leading-none text-red">{f.day}</p>
                    <p className="mt-5 text-[0.9375rem] leading-relaxed text-cream/70">{f.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal className="mt-4">
              <div className="flex flex-col gap-3 rounded-[var(--r-lg)] bg-ink-2/70 px-7 py-6 sm:flex-row sm:items-baseline sm:gap-7">
                <Label tone="light" className="shrink-0">
                  Day 1 / 2 handoff
                </Label>
                <p className="serif-it max-w-[76ch] text-[1.05rem] leading-relaxed text-cream/70">
                  A one-day compressed fallback is possible, but it becomes roughly a 9–10 hour event
                  and depends on automated Chapter II grading plus full venue / AV / judge
                  availability.
                </p>
              </div>
            </Reveal>

            <div className="mt-16 grid gap-12 pb-20 lg:grid-cols-2">
              <div>
                <Reveal>
                  <Label tone="light">People + infrastructure</Label>
                </Reveal>
                <Reveal delay={70}>
                  <dl className="mt-6">
                    {RESOURCES.map(([role, need]) => (
                      <div
                        key={role}
                        className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-cream/10 py-4 last:border-0"
                      >
                        <dt className="label w-[7rem] shrink-0 text-cream">{role}</dt>
                        <dd className="flex-1 text-[0.9375rem] text-cream/65">{need}</dd>
                      </div>
                    ))}
                  </dl>
                </Reveal>
              </div>

              <div>
                <Reveal>
                  <Label tone="light">Pre-launch gates</Label>
                </Reveal>
                <Reveal delay={70}>
                  <ul className="mt-6 grid gap-3">
                    {GATES.map((g) => (
                      <li
                        key={g}
                        className="flex items-start gap-4 text-[0.9375rem] text-cream/70"
                      >
                        <span
                          aria-hidden
                          className="mt-[3px] h-4 w-4 shrink-0 rounded-full border-2 border-red"
                        />
                        {g}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </div>
            </div>

            <GradientStrip className="absolute inset-x-0 bottom-0 h-14" />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
