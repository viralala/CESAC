import Link from "next/link";

import { TitanFigure } from "@/components/aot/art";
import { Arrow, Container, Dots, Label } from "@/components/aot/bits";
import { Seal } from "@/components/aot/seal";
import { EVENT } from "@/lib/data/event";

/**
 * Built on the Reika board: cream washi ground, one giant saturated display
 * word running the full width, and the character standing in front of it so
 * the type reads around the figure. The brush-set Japanese name overlaps the
 * word the way the script signature does there.
 *
 * That occlusion only works at width — on a phone the figure drops behind the
 * type and moves to the edge instead of swallowing it.
 */
export function Hero() {
  return (
    <section className="washi grain relative isolate flex min-h-[100svh] flex-col overflow-hidden pt-24 sm:pt-28">
      <Container className="relative flex flex-1 flex-col">
        {/* top rule */}
        <div className="flex items-start justify-between gap-6">
          <Label tone="muted" className="whitespace-nowrap">
            {EVENT.host}
          </Label>
          <Label tone="muted" className="hidden text-right sm:block">
            {EVENT.kicker}
          </Label>
        </div>

        <div className="relative mt-auto">
          {/* Japanese name, brush-set and overlapping the display word. */}
          <span
            aria-hidden
            className="jp pointer-events-none absolute -top-1 left-0 z-30 select-none text-[clamp(1.8rem,6vw,4.6rem)] leading-none text-ink sm:-top-6"
          >
            進撃の
          </span>

          <p className="label absolute -top-4 right-0 z-30 hidden text-ink sm:block">CH 01—03</p>

          <p className="d-wide relative z-20 mt-8 pl-[clamp(4.5rem,17vw,13rem)] text-[clamp(1.5rem,4.2vw,3.2rem)] text-ink sm:mt-14">
            Attack on
          </p>

          {/* the statement word */}
          <h1 className="d-wide relative z-10 text-left text-[clamp(4.2rem,21.5vw,17rem)] text-red sm:text-center">
            <span className="sr-only">Attack on Token</span>
            <span aria-hidden>Token</span>
          </h1>

          {/* the character: beside the word on a phone, in front of it above sm */}
          <TitanFigure className="pointer-events-none absolute -bottom-[6%] right-[-18%] z-0 h-[34vh] w-auto text-ink sm:-bottom-[16%] sm:left-[53%] sm:right-auto sm:z-20 sm:h-[min(58vh,480px)] sm:-translate-x-1/2" />
        </div>

        <div className="relative z-30 mt-auto grid items-end gap-8 pb-10 pt-10 lg:grid-cols-[minmax(0,20rem)_1fr_auto]">
          {/* Reika's small white info card */}
          <div className="rounded-[var(--r-md)] bg-white p-5 shadow-[0_18px_40px_-24px_rgba(21,20,26,0.55)]">
            <div className="flex items-start gap-4">
              <div className="min-w-0">
                <p className="text-[1.05rem] font-extrabold leading-tight text-red">
                  attack-on-token.exe
                </p>
                <p className="serif-it mt-1.5 text-[0.9rem] leading-snug text-ink/70">
                  Three chapters, fifty teams, one champion. Built by CESAC.
                </p>
              </div>
              <Link href="/signin" className="dot-btn shrink-0" aria-label="Enlist now">
                <Arrow />
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <Dots count={3} active={0} />
              <span className="label-sm text-muted">{EVENT.dateVenue}</span>
            </div>
          </div>

          {/* the Japanese line and serif quote that close the Reika board */}
          <div className="lg:pb-1">
            <p className="jp text-[clamp(0.95rem,1.7vw,1.4rem)] font-medium leading-snug text-ink">
              プロンプトを鍛えろ。トークンを生き延びろ。
            </p>
            <p className="serif-it mt-3 max-w-[34ch] text-[0.95rem] leading-snug text-ink/65">
              &ldquo;{EVENT.creed}&rdquo;
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/signin" className="pill pill-red">
                Enlist now
              </Link>
              <a href="#event" className="pill pill-ghost">
                Read the brief
              </a>
            </div>
          </div>

          <Seal className="hidden w-[132px] text-ink lg:block" />
        </div>
      </Container>
    </section>
  );
}
