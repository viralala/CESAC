"use client";

import { WallMark } from "@/components/aot/art";
import { Container } from "@/components/aot/bits";
import { ParallaxLayer, ParallaxScene } from "@/components/aot/parallax";
import { CursorTag, Nib, Squiggle, Sticker } from "@/components/aot/stickers";
import { RegisterButton } from "@/components/sections/event/register-button";
import { EVENT } from "@/lib/data/event";

/**
 * The board.
 *
 * There is no figure here any more, and there is not going to be one. That
 * changes what the composition has to do: the display word used to be a
 * backdrop for a character standing in front of it, and now the word is the
 * subject. So it is centred rather than pushed onto the base line, it sits on
 * a masonry mass instead of behind a body, and the stickers cluster on the
 * corners the word does not reach rather than orbiting a silhouette.
 *
 * Depth is still parallax, applied to colour and masonry: the wall barely
 * moves, the discs behind the word travel further, the seigaiha ground stays
 * put. Nothing here is a sentence the reader has to finish.
 *
 * The light comes off the event's own key art rather than off the sponsorship
 * deck. The deck's title slide is flat warm black, and as a whole first screen
 * it read as an unlit page; the poster is a sunset, so this is a sunset. Sun
 * low and right, wall in front of it, warm haze on the horizon, and the word
 * set in parchment with a crimson slash through it rather than in crimson on
 * black, which is the one pairing that was costing all the contrast.
 */

/** Three brush strokes across the display word, the way the key art cuts it. */
function Slash({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1000 280"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <g fill="var(--deck-crimson)">
        <path d="M34 214 L744 48 L752 88 L42 246 Z" opacity="0.92" />
        <path d="M402 258 L986 122 L990 146 L406 278 Z" opacity="0.6" />
        <path d="M96 84 L352 26 L356 44 L100 102 Z" opacity="0.75" />
      </g>
    </svg>
  );
}

export function EventHero() {
  return (
    <section className="deck-sky grain grain-dark relative isolate flex min-h-[100svh] flex-col overflow-hidden pt-24 sm:pt-28">
      <ParallaxScene className="pointer-events-none absolute inset-0">
        {/* the sun. Furthest back and moving least, because the thing the eye
            reads as distance is the thing that barely travels. */}
        <ParallaxLayer depth={4} drift={-6} className="absolute inset-0">
          <span
            aria-hidden
            className="absolute left-[64%] top-[66%] h-[52vmin] w-[52vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, var(--poster-sun) 0%, rgba(255,199,92,0.50) 15%, rgba(240,161,50,0.26) 33%, rgba(216,92,24,0.10) 58%, transparent 75%)",
            }}
          />
        </ParallaxLayer>

        <Squiggle className="absolute inset-0 h-full w-full opacity-[0.35]" />

        {/* the wall: the mass the word is cut out of, seated on the base line */}
        <ParallaxLayer depth={7} drift={-12} className="absolute inset-0">
          <WallMark
            className="absolute bottom-0 left-1/2 h-[58vh] w-auto -translate-x-1/2 text-cream opacity-[0.1] sm:h-[68vh]"
            style={{ maskImage: "linear-gradient(to bottom, #000 78%, transparent 99%)" }}
          />
        </ParallaxLayer>

        {/* two colour masses, offset from one another, so the middle of the
            frame has something to look at without a body standing in it */}
        <ParallaxLayer depth={20} drift={-22} className="absolute inset-0">
          <span
            aria-hidden
            className="absolute left-[10%] top-[24%] h-[32vmin] w-[32vmin] rounded-full bg-[var(--poster-ember)] opacity-[0.22] blur-[70px]"
          />
        </ParallaxLayer>
        <ParallaxLayer depth={32} drift={-30} className="absolute inset-0">
          <span
            aria-hidden
            className="absolute right-[8%] top-[14%] h-[24vmin] w-[24vmin] rounded-full bg-[var(--deck-crimson)] opacity-[0.3] blur-[50px]"
          />
        </ParallaxLayer>
      </ParallaxScene>

      {/* The horizon. It keeps the sun from washing into the closing bar and
          gives the bottom of the frame something to sit on, which is the job
          the ground does on the poster. Static, not parallaxed: a horizon that
          slides is just a band. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[34vh]"
        style={{
          background:
            "linear-gradient(to top, var(--poster-night) 0%, rgba(7,11,22,0.72) 34%, rgba(7,11,22,0.28) 66%, transparent 100%)",
        }}
      />

      {/* the event name set vertically down the right edge, the way a board
          carries its own title in the margin. From 1400px and not from xl:
          at 1280 the container runs to within a few pixels of the edge and
          this sits straight on top of the "80 teams" and "Top 8" stickers,
          which is most 14 inch laptops. */}
      <span
        aria-hidden
        className="jp pointer-events-none absolute right-3 top-[26%] z-0 hidden select-none text-[3.4rem] leading-[1.05] text-cream/[0.12] [writing-mode:vertical-rl] min-[1400px]:block"
      >
        {EVENT.jp}
      </span>

      {/* the deck's registration marks. On the Container rather than the
          section because `grain` already owns the section's ::after. */}
      <Container className="deck-marks relative flex flex-1 flex-col pb-4">
        {/* mb keeps 進撃の, which hangs above the centred block, off this row
            on a short laptop screen. See the note on the home hero. */}
        <div className="relative z-30 mb-4 flex items-start justify-between gap-6 sm:mb-10">
          <p className="label text-[var(--poster-amber)]">{EVENT.host}</p>
          <p className="label hidden text-right text-[var(--poster-amber)] sm:block">
            {EVENT.kicker}
          </p>
        </div>

        {/* my-auto, not mt-auto: with nothing standing in the frame the word
            belongs on the optical centre, not shoved onto the base line */}
        <div className="relative my-auto py-6">
          {/* brush-set Japanese, overlapping the display word */}
          <span
            aria-hidden
            className="jp pointer-events-none absolute -top-1 left-0 z-30 select-none text-[clamp(1.8rem,6vw,4.6rem)] leading-none text-[#f0a13280] sm:-top-6"
          >
            進撃の
          </span>

          <p className="d-wide relative z-30 mt-8 pl-[clamp(2rem,8vw,6.5rem)] text-[clamp(1.5rem,4.2vw,3.2rem)] text-cream sm:mt-14">
            Attack on
          </p>

          {/* The statement word, the subject of the frame. Parchment with the
              crimson behind it rather than in it: crimson type on a dark sky
              was the darkest thing on the darkest screen of the site. */}
          <div className="relative">
            <Slash className="pointer-events-none absolute inset-x-0 top-[6%] z-10 h-[86%] w-full" />
            <h1 className="d-wide relative z-20 text-left text-[clamp(4.4rem,22vw,17.5rem)] leading-[0.82] text-cream sm:text-center">
              <span className="sr-only">Attack on Token</span>
              <span aria-hidden>Token</span>
            </h1>
          </div>

          {/* the tagline, hung off the right of the word so the block closes */}
          <p className="serif-it relative z-30 mt-5 max-w-[30ch] text-[clamp(1rem,1.6vw,1.25rem)] leading-snug text-cream/70 sm:ml-auto sm:mt-6 sm:text-right">
            {EVENT.tagline}
          </p>

          {/* ---------------------------- the sticker cluster -------------
              Placed on the corners the word cannot fill. Nothing sits over the
              middle any more, because there is no figure to break the line. */}

          <Sticker
            shape="burst"
            pop="pink"
            rotate={-9}
            float={0}
            size="clamp(5.2rem,9vw,7rem)"
            className="absolute -top-8 right-[1%] z-40 text-[0.72rem] sm:right-[2%] sm:top-[2%] sm:text-[clamp(0.72rem,1.1vw,0.9rem)]"
          >
            <span>
              80
              <br />
              <span className="label-sm opacity-80">teams</span>
            </span>
          </Sticker>

          <Sticker
            shape="blob"
            pop="lime"
            rotate={-4}
            float={0.7}
            className="absolute right-[15%] top-[1%] z-40 hidden text-[0.8rem] lg:grid"
          >
            2 per team
          </Sticker>

          <Sticker
            shape="leaf"
            pop="blue"
            rotate={-11}
            float={1.4}
            className="absolute left-[0%] top-[6%] z-40 hidden text-[0.78rem] md:grid"
          >
            <span>
              &#8377;125
              <br />
              <span className="opacity-75">per team</span>
            </span>
          </Sticker>

          <Sticker
            shape="scallop"
            pop="white"
            rotate={7}
            float={2.1}
            size="clamp(6rem,9.5vw,7.6rem)"
            className="absolute bottom-[-4%] left-[2%] z-40 hidden text-[clamp(0.7rem,1vw,0.85rem)] sm:grid"
          >
            <span>
              3<br />
              <span className="text-[0.55rem] font-bold uppercase tracking-[0.16em] text-muted">
                chapters
              </span>
            </span>
          </Sticker>

          <Sticker
            shape="octo"
            pop="red"
            rotate={-6}
            float={1.1}
            size="clamp(4.4rem,7vw,5.6rem)"
            className="absolute right-[0%] top-[44%] z-40 hidden text-[clamp(0.62rem,0.9vw,0.74rem)] md:grid"
          >
            <span>
              Top 8
              <br />
              <span className="opacity-80">final</span>
            </span>
          </Sticker>

          <Sticker
            shape="ribbon"
            pop="violet"
            rotate={-5}
            float={2.6}
            className="absolute bottom-[-6%] right-[6%] z-40 hidden text-[0.78rem] lg:grid"
          >
            <span>
              Two days
              <br />
              <span className="opacity-75">one champion</span>
            </span>
          </Sticker>

          <CursorTag label="You" className="absolute left-[16%] top-[2%] z-40 hidden lg:flex" />
          <Nib className="pointer-events-none absolute bottom-[10%] left-[34%] z-30 hidden h-10 w-10 xl:block" />
        </div>

        {/* --------------------------- the closing bar --------------------- */}
        <div className="relative z-40 mt-6 grid items-end gap-6 pb-10 lg:grid-cols-[minmax(0,19rem)_1fr]">
          <div className="card p-5">
            <p className="text-[1.05rem] font-extrabold leading-tight text-teal">
              attack-on-token.exe
            </p>
            <p className="serif-it mt-1.5 text-[0.9rem] leading-snug text-ink/70">{EVENT.creed}</p>
            <p className="label-sm mt-4 text-muted">{EVENT.dateVenue}</p>
          </div>

          <div className="flex justify-start lg:justify-end">
            <div className="toolbar flex-wrap">
              <a href="#chapters" className="toolbar-seg label-sm hidden sm:inline-flex">
                Open: <span className="text-cream">Chapters</span>
              </a>
              <RegisterButton size="sm" />
              <a href="#prizes" className="toolbar-seg label-sm hidden sm:inline-flex">
                View: <span className="text-cream">Prizes</span>
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
