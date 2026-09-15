import { Container } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import { Chip } from "@/components/hrfb/chip";
import { QUESTION_GROUPS } from "@/lib/data/hr-final-boss";

/**
 * The kind of questions the floor is open for, floated as chips rather than
 * written out as a paragraph. These are illustrative prompts to get the room
 * thinking, not a submitted question bank, and the copy says so.
 */
export function HrfbAsk() {
  return (
    <section id="ask" className="grid-box scroll-mt-24 py-16 sm:py-24">
      <Container>
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-[30ch]">
              <p className="label-sm text-hb-azure-deep">Ask anything</p>
              <h2 className="hb-display mt-4 text-[clamp(2.4rem,6.5vw,4.4rem)] uppercase leading-[0.94] text-hb-ink">
                Bring the
                <br />
                hard ones.
              </h2>
            </div>
            <p className="hb-cursive max-w-[36ch] text-[1.1rem] leading-snug text-hb-ink/65">
              A taste of what the floor is open for. Nobody is reading off this list, it is just
              here to get the room warmed up.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {QUESTION_GROUPS.map((g, gi) => (
            <Reveal key={g.id} delay={gi * 90}>
              <div className="h-full rounded-[var(--r-xl)] border-2 border-hb-azure/15 bg-hb-deutzia p-6 sm:p-7">
                <p className="hb-display text-[1.3rem] uppercase text-hb-azure-deep">{g.title}</p>
                <div className="mt-5 flex flex-wrap gap-2.5">
                  {g.prompts.map((p, pi) => (
                    <Chip key={p} pop={g.pop} rotate={pi % 2 === 0 ? -2 : 2} float={pi * 0.4}>
                      {p}
                    </Chip>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
