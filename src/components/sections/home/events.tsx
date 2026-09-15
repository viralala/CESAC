import Link from "next/link";

import { WallMark } from "@/components/aot/art";
import { Arrow, Container, Label, SectionHead } from "@/components/aot/bits";
import { ParallaxLayer, ParallaxScene } from "@/components/aot/parallax";
import { Reveal } from "@/components/aot/reveal";
import { Sticker } from "@/components/aot/stickers";
import { EVENTS } from "@/lib/data/cesac";

const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  open: { label: "Registration open", bg: "var(--lime)", fg: "var(--ink)" },
  announced: { label: "Announced", bg: "var(--azure)", fg: "var(--ink)" },
  past: { label: "Wrapped", bg: "var(--cream-3)", fg: "var(--ink)" },
};

/**
 * The events board.
 *
 * The first entry gets the full panel, because an event-first homepage should
 * show the thing that is actually happening rather than list it. Anything
 * after the first is a full-width card in the same teal family as the
 * feature panel, but carrying its own background design — a diagonal line
 * weave plus a dot-grid corner — instead of the feature panel's washi swirl,
 * so the two read as siblings in the same palette rather than duplicates.
 *
 * Cards stack full-width (one per row) with a tall min-height, so a single
 * additional event still carries visual weight on the page.
 *
 * One event is listed because one event exists. If this ever renders a thin
 * list, that is the honest state of the calendar, not a bug to pad.
 */
export function HomeEvents() {
  const [feature, ...rest] = EVENTS;

  return (
    <section id="events" className="washi grain relative scroll-mt-24 py-20 sm:py-24">
      <Container className="relative">
        <Reveal>
          <SectionHead
            eyebrow="What we run"
            title="Events"
            aside="Competitions, workshops and department activities, planned and run by students."
          />
        </Reveal>

        {feature ? (
          <Reveal className="mt-14">
            <article className="washi-deep grain grain-dark relative isolate overflow-hidden rounded-[var(--r-xl)] text-cream">
              <div className="grid items-stretch gap-0 lg:grid-cols-[1.08fr_0.92fr]">
                <div className="relative z-20 px-7 py-12 sm:px-11 sm:py-16">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className="label-sm w-fit rounded-full px-4 py-2"
                      style={{
                        background: STATUS[feature.status].bg,
                        color: STATUS[feature.status].fg,
                      }}
                    >
                      {STATUS[feature.status].label}
                    </span>
                    <Label tone="light">{feature.kicker}</Label>
                  </div>

                  <h3 className="d-tall mt-7 text-[clamp(2.6rem,7vw,4.8rem)] text-cream">
                    {feature.name}
                  </h3>
                  <p className="jp mt-3 text-[clamp(1rem,1.8vw,1.35rem)] text-lime">
                    {feature.jp}
                  </p>

                  <p className="mt-6 max-w-[46ch] text-[1rem] leading-relaxed text-cream/75">
                    {feature.blurb}
                  </p>

                  <p className="label mt-8 text-cream/45">{feature.when}</p>

                  <div className="mt-9 flex flex-wrap gap-3">
                    <Link href={feature.href} className="pill pill-lime px-7 py-3.5">
                      Open the event
                      <Arrow />
                    </Link>
                    <Link href="/signin" className="pill pill-ghost-light">
                      Sign in
                    </Link>
                  </div>
                </div>

                {/* The plate. There is no figure on this site, so the panel is
                    closed with masonry, the event's own name set vertically,
                    and one lit mass, all on parallax planes. */}
                <div className="relative min-h-[260px] overflow-hidden lg:min-h-[460px]">
                  <ParallaxScene className="pointer-events-none absolute inset-0">
                    <ParallaxLayer depth={9} drift={-14} className="absolute inset-0">
                      <WallMark className="absolute bottom-0 left-1/2 h-[96%] w-auto -translate-x-1/2 text-cream opacity-[0.09]" />
                    </ParallaxLayer>
                    <ParallaxLayer depth={28} drift={-26} className="absolute inset-0">
                      <span
                        aria-hidden
                        className="absolute left-[16%] top-[16%] aspect-square h-[42%] rounded-full bg-lime opacity-25 blur-2xl"
                      />
                    </ParallaxLayer>
                  </ParallaxScene>

                  <span
                    aria-hidden
                    className="jp pointer-events-none absolute right-6 top-8 select-none text-[clamp(2rem,3.6vw,3.2rem)] leading-[1.05] text-cream/[0.16] [writing-mode:vertical-rl]"
                  >
                    {feature.jp}
                  </span>

                  <Sticker
                    shape="octo"
                    pop="pink"
                    rotate={-8}
                    float={0.6}
                    size="clamp(4.4rem,7vw,5.6rem)"
                    className="absolute left-[6%] top-[12%] z-30 hidden text-[0.66rem] sm:grid"
                  >
                    <span>
                      50
                      <br />
                      <span className="opacity-80">teams</span>
                    </span>
                  </Sticker>
                </div>
              </div>
            </article>
          </Reveal>
        ) : null}

        {rest.length ? (
          <div className="mt-6 flex flex-col gap-6">
            {rest.map((e, i) => (
              <Reveal key={e.slug} delay={i * 70}>
                <Link
                  href={e.href}
                  className="group relative isolate flex min-h-[380px] w-full cursor-pointer flex-col overflow-hidden rounded-[var(--r-xl)] p-9 text-cream transition-transform duration-300 hover:-translate-y-1 sm:min-h-[440px] sm:p-14"
                  style={{
                    background:
                      "linear-gradient(155deg, var(--ink) 0%, #0f3a3a 50%, var(--teal) 140%)",
                  }}
                >
                  {/* Own background design, same teal family as the feature
                      panel: a diagonal line weave across the whole card plus
                      a dot-grid mass in the corner, instead of the feature
                      panel's washi swirl + single glow. */}
                  <svg
                    aria-hidden
                    className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.14]"
                  >
                    <defs>
                      <pattern
                        id={`diagonal-${e.slug}`}
                        width="26"
                        height="26"
                        patternUnits="userSpaceOnUse"
                        patternTransform="rotate(35)"
                      >
                        <line x1="0" y1="0" x2="0" y2="26" stroke="var(--cream)" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#diagonal-${e.slug})`} />
                  </svg>

                  <svg
                    aria-hidden
                    className="pointer-events-none absolute -right-6 -top-6 h-[60%] w-[46%] opacity-[0.22] sm:h-[70%] sm:w-[40%]"
                  >
                    <defs>
                      <pattern
                        id={`dots-${e.slug}`}
                        width="16"
                        height="16"
                        patternUnits="userSpaceOnUse"
                      >
                        <circle cx="2" cy="2" r="1.6" fill="var(--lime)" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill={`url(#dots-${e.slug})`} />
                  </svg>

                  <ParallaxScene className="pointer-events-none absolute inset-0">
                    <ParallaxLayer depth={26} drift={-20} className="absolute inset-0">
                      <span
                        aria-hidden
                        className="absolute left-[10%] bottom-[-10%] aspect-square h-[42%] rounded-full bg-teal-2 opacity-25 blur-3xl transition-opacity duration-300 group-hover:opacity-35"
                      />
                    </ParallaxLayer>
                  </ParallaxScene>

                  {e.jp ? (
                    <span
                      aria-hidden
                      className="jp pointer-events-none absolute right-8 top-9 select-none text-[clamp(2rem,3.4vw,3rem)] leading-[1.05] text-cream/[0.14] [writing-mode:vertical-rl]"
                    >
                      {e.jp}
                    </span>
                  ) : null}

                  <div className="relative z-20 flex h-full max-w-[62ch] flex-col">
                    <span
                      className="label-sm w-fit rounded-full px-4 py-2"
                      style={{
                        background: STATUS[e.status].bg,
                        color: STATUS[e.status].fg,
                      }}
                    >
                      {STATUS[e.status].label}
                    </span>

                    <h3 className="d-tall mt-7 text-[clamp(2.4rem,5.5vw,4rem)] text-cream">
                      {e.name}
                    </h3>
                    <p className="mt-4 max-w-[48ch] text-[1.05rem] leading-relaxed text-cream/70">
                      {e.blurb}
                    </p>

                    <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-10">
                      <p className="label text-cream/45">{e.when}</p>
                      <span
                        aria-hidden
                        className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-cream/10 text-cream transition-all duration-300 group-hover:translate-x-0.5 group-hover:bg-lime group-hover:text-ink"
                      >
                        <Arrow />
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal className="mt-4">
            <p className="rounded-[var(--r-lg)] bg-cream-2 px-7 py-6 text-[0.95rem] text-muted">
              Nothing else is on the calendar yet. New events are posted here as they are
              confirmed.
            </p>
          </Reveal>
        )}
      </Container>
    </section>
  );
}