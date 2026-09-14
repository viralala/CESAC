import { Container, SectionHead } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import { Sticker } from "@/components/aot/stickers";
import { AWARDS } from "@/lib/data/event";

const POP: Record<string, string> = {
  azure: "var(--azure)",
  violet: "var(--violet)",
  lime: "var(--lime)",
  pink: "var(--pink)",
};

const ON_POP: Record<string, string> = {
  azure: "var(--ink)",
  violet: "var(--white)",
  lime: "var(--ink)",
  pink: "var(--white)",
};

/**
 * Six ways to win, colour-coded to the chapter that awards them. The point a
 * reader needs is that losing the cut does not end your event — so the chapter
 * marker is the loudest thing on each plate.
 */
export function EventPrizes() {
  return (
    <section id="prizes" className="washi grain relative scroll-mt-24 py-24 sm:py-28">
      <Container className="relative">
        <Reveal>
          <SectionHead
            eyebrow="Six ways to win"
            title={
              <>
                Every chapter
                <br />
                pays out
              </>
            }
            aside="Miss the cut and you can still leave with an award. Each chapter keeps one of its own."
          />
        </Reveal>

        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AWARDS.map((a, i) => (
            <Reveal key={a.title} delay={i * 60}>
              <div className="card group relative h-full overflow-hidden p-7 transition-transform duration-300 hover:-translate-y-1">
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1.5"
                  style={{ background: POP[a.pop] }}
                />
                <span
                  className="grid h-10 w-10 place-items-center rounded-full text-[0.9rem] font-extrabold tracking-[0.08em]"
                  style={{ background: POP[a.pop], color: ON_POP[a.pop] }}
                >
                  {a.chapter}
                </span>
                <h3 className="d-tall mt-5 text-[1.75rem] leading-tight text-ink">{a.title}</h3>
                <p className="serif-it mt-1.5 text-[0.95rem] text-muted">{a.note}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-4">
          <div className="relative flex flex-col items-start gap-5 rounded-[var(--r-xl)] bg-cream-2 px-8 py-8 sm:flex-row sm:items-center sm:gap-10">
            <p className="d-wide text-[3.5rem] leading-none text-teal">TBA</p>
            <p className="serif-it max-w-[54ch] text-[1.05rem] leading-relaxed text-ink/75">
              The prize pool is confirmed alongside the sponsor package, just before registration
              opens.
            </p>
            <Sticker
              shape="ribbon"
              pop="lime"
              rotate={-4}
              float={1.2}
              className="absolute -top-4 right-6 hidden text-[0.72rem] sm:grid"
            >
              Pool locking soon
            </Sticker>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
