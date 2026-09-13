import { Container, SectionHead } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import { VERTICALS } from "@/lib/data/committee";

/**
 * Deliberately quiet: a roster, not a showcase. Dense columns, hairline rules,
 * no portraits — the team is context for the event, not the headline.
 */
export function Team() {
  return (
    <section id="team" className="grain relative scroll-mt-24 bg-cream py-24 sm:py-28">
      <Container className="relative">
        <Reveal>
          <SectionHead
            eyebrow="The team"
            title="Who runs the walls"
            lede="Four verticals carry Attack on Token from planning to run-of-show. Listed here for reference."
          />
        </Reveal>

        <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {VERTICALS.map((v, i) => (
            <Reveal key={v.id} delay={i * 70}>
              <div className="h-full border-t-2 border-ink pt-5">
                <div className="flex items-baseline gap-3">
                  <span className="d-wide text-lg leading-none text-red">{v.index}</span>
                  <div>
                    <h3 className="d-tall text-[1.3rem] leading-tight text-ink">{v.name}</h3>
                    <p className="jp text-xs text-muted">{v.jp}</p>
                  </div>
                </div>

                <p className="serif-it mt-3 text-[0.875rem] leading-relaxed text-muted">{v.remit}</p>

                <ul className="mt-5">
                  {v.members.map((m) => (
                    <li
                      key={m}
                      className="border-b border-ink/8 py-2 text-[0.9375rem] leading-snug text-ink"
                    >
                      {m}
                    </li>
                  ))}
                </ul>

                <p className="label-sm mt-3 text-muted">
                  {String(v.members.length).padStart(2, "0")} members
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
