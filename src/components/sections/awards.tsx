import { Container, SectionHead } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import { AWARDS } from "@/lib/data/event";

export function Awards() {
  return (
    <section id="awards" className="grain relative scroll-mt-24 bg-cream py-24 sm:py-32">
      <Container className="relative">
        <Reveal>
          <SectionHead
            eyebrow="Scoring / awards"
            title="Every chapter counts"
            lede="The elimination is sharp; the recognition is broad. Each chapter keeps a standalone award, so a team that does not advance still has something real to win."
          />
        </Reveal>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AWARDS.map((a, i) => (
            <Reveal key={a.title} delay={i * 60}>
              <div className="plate-tr group h-full bg-white p-7 transition-colors hover:bg-ink">
                <p className="label text-red">{a.chapter}</p>
                <h3 className="d-tall mt-4 text-[1.9rem] leading-tight text-ink transition-colors group-hover:text-cream">
                  {a.title}
                </h3>
                <p className="serif-it mt-2 text-[0.95rem] text-muted transition-colors group-hover:text-cream/60">
                  {a.note}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-6">
          <div className="flex flex-col items-start gap-5 rounded-[var(--r-xl)] bg-cream-2 px-8 py-8 sm:flex-row sm:items-center sm:gap-10">
            <p className="d-wide text-[3.5rem] leading-none text-red">TBA</p>
            <p className="serif-it max-w-[62ch] text-[1.05rem] leading-relaxed text-ink/75">
              Prize amounts are intentionally not published yet. The pool is confirmed alongside the
              sponsor package before registration opens.
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
