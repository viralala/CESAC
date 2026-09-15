import { Container } from "@/components/aot/bits";
import { ParallaxLayer, ParallaxScene } from "@/components/aot/parallax";
import { Chip } from "@/components/hrfb/chip";
import { AGENDA, HRFB } from "@/lib/data/hr-final-boss";

/**
 * The board, in this page's own language: a grid-box ground instead of
 * seigaiha clouds, blue and white instead of teal, and a cartoon-round
 * display word instead of the tall condensed one. Same structural idea as
 * the Attack on Token hero though: one statement word carries the frame,
 * colour masses sit behind it, and small facts cluster on the corners.
 */
export function HrfbHero() {
  return (
    <section className="grid-box relative isolate flex min-h-[100svh] flex-col overflow-hidden pt-24 sm:pt-28">
      <ParallaxScene className="pointer-events-none absolute inset-0">
        <ParallaxLayer depth={22} drift={-20} className="absolute inset-0">
          <span
            aria-hidden
            className="absolute left-[10%] top-[22%] h-[32vmin] w-[32vmin] rounded-full bg-hb-azure opacity-[0.16] blur-[6px]"
          />
        </ParallaxLayer>
        <ParallaxLayer depth={34} drift={-30} className="absolute inset-0">
          <span
            aria-hidden
            className="absolute right-[8%] top-[16%] h-[24vmin] w-[24vmin] rounded-full bg-hb-maya opacity-40 blur-xl"
          />
        </ParallaxLayer>
      </ParallaxScene>

      {/* the event name set vertically down the right edge, the way AoT
          carries its own title in the margin, in Devanagari here */}
      <span
        aria-hidden
        className="hb-cursive pointer-events-none absolute right-3 top-[24%] z-0 hidden select-none text-[3.2rem] leading-[1.05] text-hb-azure/[0.14] [writing-mode:vertical-rl] xl:block"
      >
        {HRFB.devanagari}
      </span>

      <Container className="relative flex flex-1 flex-col">
        <div className="relative z-30 flex items-start justify-between gap-6">
          <p className="label text-hb-azure-deep">{HRFB.host}</p>
          <p className="label hidden text-right text-hb-azure-deep sm:block">{HRFB.kicker}</p>
        </div>

        <div className="relative my-auto py-6">
          <span
            aria-hidden
            className="hb-cursive pointer-events-none absolute -top-2 left-0 z-30 select-none text-[clamp(1.8rem,5.5vw,3.8rem)] leading-none text-hb-azure-deep sm:-top-7"
          >
            {HRFB.devanagari}
          </span>

          <p className="hb-display relative z-30 mt-9 pl-[clamp(1.6rem,6vw,4.5rem)] text-[clamp(1.5rem,4vw,2.9rem)] uppercase text-hb-ink sm:mt-16">
            The
          </p>

          <h1 className="hb-display relative z-20 text-left text-[clamp(3.6rem,17vw,13rem)] uppercase leading-[0.86] text-hb-azure sm:text-center">
            HR
            <br />
            <span className="text-hb-ink">Final Boss</span>
          </h1>

          <p className="hb-cursive relative z-30 mt-5 max-w-[32ch] text-[clamp(1.1rem,1.8vw,1.4rem)] leading-snug text-hb-ink/75 sm:ml-auto sm:mt-6 sm:text-right">
            {HRFB.tagline}
          </p>

          <Chip
            pop="azure"
            rotate={-6}
            float={0}
            className="absolute -top-6 right-[2%] z-40 sm:right-[4%] sm:top-[0%]"
          >
            Free entry
          </Chip>
          <Chip
            pop="maya"
            rotate={5}
            float={1.1}
            className="absolute left-[0%] top-[8%] z-40 hidden md:inline-flex"
          >
            {HRFB.format}
          </Chip>
          <Chip
            pop="ink"
            rotate={-4}
            float={2}
            className="absolute bottom-[-2%] left-[4%] z-40 hidden lg:inline-flex"
          >
            Speaker: locked for now
          </Chip>
        </div>

        <div className="relative z-40 mt-6 grid items-end gap-6 pb-10 lg:grid-cols-[minmax(0,20rem)_1fr]">
          <div className="rounded-[var(--r-lg)] border-2 border-hb-azure/20 bg-hb-deutzia p-5 shadow-[0_18px_40px_-28px_rgba(7,26,51,0.5)]">
            <p className="hb-display text-[1.15rem] text-hb-azure-deep">hr-final-boss.exe</p>
            <p className="hb-cursive mt-1.5 text-[0.95rem] leading-snug text-hb-ink/70">
              {HRFB.creed}
            </p>
            <p className="label-sm mt-4 text-hb-ink/50">{HRFB.dateVenue}</p>
          </div>

          <div className="flex justify-start lg:justify-end">
            <div className="flex flex-wrap items-center gap-2 rounded-full bg-hb-ink p-1.5 shadow-[0_18px_40px_-24px_rgba(7,26,51,0.7)]">
              <a
                href="#ask"
                className="hidden rounded-full px-4 py-2.5 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-hb-ghost/60 transition-colors hover:text-hb-ghost sm:inline-flex"
              >
                Open: <span className="ml-1 text-hb-maya">Ask anything</span>
              </a>
              <a
                href="#boss-file"
                className="inline-flex rounded-full bg-hb-azure px-6 py-2.5 text-[0.8rem] font-bold text-white transition-transform hover:-translate-y-0.5"
              >
                See the tease
              </a>
              <a
                href="#agenda"
                className="hidden rounded-full px-4 py-2.5 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-hb-ghost/60 transition-colors hover:text-hb-ghost sm:inline-flex"
              >
                View: <span className="ml-1 text-hb-maya">{AGENDA.length}-step agenda</span>
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
