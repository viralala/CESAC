import { Container } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import { AGENDA } from "@/lib/data/hr-final-boss";

/**
 * A rough shape for the room. Timings are approximate on purpose, the way
 * the copy phrases them, since nothing here is locked yet.
 */
export function HrfbAgenda() {
  return (
    <section id="agenda" className="grid-box-deep scroll-mt-24 py-16 sm:py-24">
      <Container>
        <Reveal>
          <p className="label-sm text-hb-maya">Roughly how it runs</p>
          <h2 className="hb-display mt-4 text-[clamp(2.4rem,6.5vw,4.4rem)] uppercase leading-[0.94] text-hb-ghost">
            The shape
            <br />
            of the room.
          </h2>
        </Reveal>

        <ol className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {AGENDA.map((a, i) => (
            <Reveal key={a.step} delay={i * 90} as="li">
              <div className="h-full rounded-[var(--r-lg)] border-2 border-hb-ghost/10 bg-hb-ghost/[0.06] p-6 backdrop-blur-sm">
                <span className="hb-display text-[2.4rem] leading-none text-hb-maya">
                  {a.step}
                </span>
                <p className="hb-display mt-4 text-[1.35rem] uppercase text-hb-ghost">{a.title}</p>
                <p className="label-sm mt-2 text-hb-maya/80">{a.time}</p>
                <p className="mt-3 text-[0.9rem] leading-snug text-hb-ghost/60">{a.note}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
