import { Arrow, Container, Label, SectionHead } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import { CHAPTERS, SNAPSHOT } from "@/lib/data/event";

export function Snapshot() {
  return (
    <section id="event" className="grain relative scroll-mt-24 bg-cream py-24 sm:py-32">
      <Container className="relative">
        <Reveal>
          <SectionHead
            eyebrow="Event snapshot"
            title="The event, in one frame"
            lede="A focused AI competition built as a manga-style progression funnel — broad entry, sharp filtering, high-touch finale."
          />
        </Reveal>

        {/* soft white plates rather than the deck's hard-ruled boxes */}
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SNAPSHOT.map((s, i) => (
            <Reveal key={s.label} delay={i * 70}>
              <div className="h-full rounded-[var(--r-lg)] bg-white p-7 shadow-[0_20px_50px_-34px_rgba(21,20,26,0.6)]">
                <p className="d-wide text-[3.5rem] leading-none text-red">{s.value}</p>
                <p className="label mt-4 text-ink">{s.label}</p>
                <p className="serif-it mt-1.5 text-[0.95rem] text-muted">{s.note}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* core progression */}
        <Reveal className="mt-20">
          <Label>The core progression</Label>
        </Reveal>

        <div className="mt-5 grid items-stretch gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {CHAPTERS.map((c, i) => (
            <div key={c.id} className="contents">
              <Reveal delay={i * 90}>
                <a
                  href={`#${c.id}`}
                  className="group flex h-full flex-col justify-between rounded-[var(--r-lg)] border-2 border-ink/10 bg-white p-7 transition-colors hover:border-ink hover:bg-ink"
                >
                  <div>
                    <Label className="transition-colors group-hover:text-red-soft">
                      Chapter {c.index}
                    </Label>
                    <p className="d-tall mt-3 text-[2.4rem] text-ink transition-colors group-hover:text-cream">
                      {c.title}
                    </p>
                    <p className="jp mt-1 text-sm text-muted">{c.jp}</p>
                  </div>
                  <div className="mt-8 flex items-center justify-between">
                    <p className="label text-muted transition-colors group-hover:text-cream/70">
                      {c.from} → {c.to}
                    </p>
                    <span className="dot-btn h-9 w-9 opacity-0 transition-opacity group-hover:opacity-100">
                      <Arrow className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </a>
              </Reveal>
              {i < CHAPTERS.length - 1 ? (
                <div
                  aria-hidden
                  className="hidden items-center justify-center text-red lg:flex"
                >
                  <Arrow className="h-6 w-6 rotate-45" />
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {/* planning-lock note, set as a serif aside */}
        <Reveal className="mt-10">
          <div className="flex flex-col gap-3 rounded-[var(--r-lg)] bg-cream-2 px-7 py-6 sm:flex-row sm:items-baseline sm:gap-7">
            <Label className="shrink-0">Planning lock</Label>
            <p className="serif-it max-w-[76ch] text-[1.05rem] leading-relaxed text-ink/75">
              The event uses a cumulative weighted score for the overall Champion, while each chapter
              retains an independent award so eliminated teams still have something meaningful to
              win.
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
