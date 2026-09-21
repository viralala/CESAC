"use client";

import Link from "next/link";

import { Container } from "@/components/aot/bits";
import { ParallaxLayer, ParallaxScene } from "@/components/aot/parallax";
import { Sticker } from "@/components/aot/stickers";
import { CESAC } from "@/lib/data/cesac";

/**
 * The community hero.
 *
 * It has one job the event hero does not: say what CESAC is and what you can
 * do next, in one read, without a marketing sentence. So the giant word is the
 * name, the line under it is a definition, and the two buttons are the only
 * two things a visitor can actually do today.
 *
 * Depth comes from colour masses on parallax planes. There is no figure here,
 * and there is none anywhere else on the site either.
 */

const BLOBS = [
  { c: "var(--azure)", d: 26, cls: "left-[4%] top-[14%] h-[26vmin] w-[26vmin]" },
  { c: "var(--violet)", d: 15, cls: "right-[6%] top-[8%] h-[20vmin] w-[20vmin]" },
  { c: "var(--pink)", d: 34, cls: "right-[16%] bottom-[12%] h-[16vmin] w-[16vmin]" },
  { c: "var(--lime)", d: 20, cls: "left-[18%] bottom-[8%] h-[22vmin] w-[22vmin]" },
];

export function HomeHero({ members, verticals }: { members: number; verticals: number }) {
  return (
    <section className="washi grain relative isolate flex min-h-[92svh] flex-col overflow-hidden pt-24 sm:pt-28">
      <ParallaxScene className="pointer-events-none absolute inset-0">
        {BLOBS.map((b) => (
          <ParallaxLayer key={b.cls} depth={b.d} drift={-18} className="absolute inset-0">
            <span
              aria-hidden
              className={`absolute rounded-full blur-2xl ${b.cls}`}
              style={{ background: b.c, opacity: 0.22 }}
            />
          </ParallaxLayer>
        ))}
      </ParallaxScene>

      <Container className="relative flex flex-1 flex-col">
        <div className="relative z-30 flex items-start justify-between gap-6">
          <p className="label text-teal">{CESAC.department}</p>
          <p className="label hidden text-right text-teal sm:block">{CESAC.short}</p>
        </div>

        <div className="relative my-auto">
          <span
            aria-hidden
            className="jp pointer-events-none absolute -top-2 left-0 z-30 select-none text-[clamp(1.6rem,5vw,3.8rem)] leading-none text-teal-2 sm:-top-6"
          >
            学生委員会
          </span>

          <h1 className="relative z-20 pt-10 sm:pt-14">
            <span className="sr-only">
              {CESAC.abbr}, the {CESAC.name}
            </span>
            <span
              aria-hidden
              className="d-wide block text-left text-[clamp(4.6rem,23vw,18rem)] leading-[0.82] text-teal"
            >
              CESAC
            </span>
          </h1>

          <p className="relative z-20 mt-7 max-w-[52ch] text-[clamp(1.05rem,2.1vw,1.4rem)] font-semibold leading-snug text-ink">
            {CESAC.what}
          </p>

          <div className="relative z-30 mt-9 flex flex-wrap items-center gap-3">
            <Link href="/events/attack-on-token" className="pill pill-lime px-7 py-3.5">
              See Attack on Token
            </Link>
            <Link href="/about" className="pill pill-ghost">
              What CESAC is
            </Link>
          </div>

          {/* real counts only: both are derived from the committee roster.
              Hidden below xl: the word fills nearly the whole line at every
              narrower width, so this badge has nowhere to sit without
              overlapping a letter. */}
          <Sticker
            shape="burst"
            pop="pink"
            rotate={-8}
            float={0.2}
            size="clamp(5.6rem,8.5vw,6.8rem)"
            className="absolute right-[1%] top-[14%] z-40 hidden text-[0.78rem] xl:grid xl:right-[2%] xl:text-[clamp(0.78rem,1vw,0.9rem)]"
          >
            <span>
              {members}
              {/* Tighter than label-sm: at the clamp floor the badge is 90px
                  across and "MEMBERS" at the normal 0.2em tracking runs past
                  the clip-path edge. */}
              <br />
              <span className="text-[0.5rem] font-bold uppercase tracking-[0.1em] opacity-80">
                members
              </span>
            </span>
          </Sticker>

          <Sticker
            shape="leaf"
            pop="blue"
            rotate={-6}
            float={1.3}
            className="absolute bottom-[18%] right-[4%] z-40 hidden text-[0.78rem] lg:grid"
          >
            <span>
              {verticals}
              <br />
              <span className="opacity-75">verticals</span>
            </span>
          </Sticker>

          <Sticker
            shape="blob"
            pop="lime"
            rotate={4}
            float={2.2}
            className="absolute bottom-[-6%] right-[22%] z-40 hidden text-[0.78rem] xl:grid"
          >
            Student run
          </Sticker>
        </div>

        <div className="relative z-30 pt-8 pb-10">
          <p className="label-sm text-muted">{CESAC.institute}</p>
        </div>
      </Container>
    </section>
  );
}
