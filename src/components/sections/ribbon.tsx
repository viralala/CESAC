"use client";

import { useEffect, useId, useRef } from "react";

/**
 * The running ribbon.
 *
 * The old version was a straight full-bleed band, which is the one marquee
 * everybody has seen. This one rides a curve: the ribbon is a thick stroked
 * path, the words run along that same path, and the band deliberately occupies
 * part of its section instead of the whole width, so it reads as an object
 * lying on the page rather than as a border.
 *
 * The text is repeated REPEATS times and the offset loops over the width of a
 * single repeat, so the seam always lands on identical glyphs. That width is
 * measured off a hidden straight copy of one repeat, because
 * `getComputedTextLength()` on the visible <text> is unreliable once its
 * content sits inside a <textPath>.
 *
 * The loop mutates one attribute per frame and never re-renders.
 */

const REPEATS = 8;

/** viewBox units per second along the path. */
const SPEED = 46;

const SEP = "   /   ";

/** Japanese gets the accent colour, so the band carries more than one hue. */
const JP = /[　-鿿]/;

export function Ribbon({
  items,
  className = "",
  tone = "ink",
}: {
  items: readonly string[];
  className?: string;
  tone?: "ink" | "teal";
}) {
  const uid = useId().replace(/:/g, "");
  const pathId = `ribbon-${uid}`;
  const textPathRef = useRef<SVGTextPathElement>(null);
  const rulerRef = useRef<SVGTextElement>(null);
  const hostRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const tp = textPathRef.current;
    const ruler = rulerRef.current;
    const host = hostRef.current;
    if (!tp || !ruler || !host) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // One repeat's advance width. Re-measurable, and never a reason to bail:
    // an early return here is permanent, so a single zero reading at mount
    // (fonts still swapping, or a StrictMode remount before layout) would kill
    // the band for the life of the page. That is exactly what it used to do.
    let span = 0;
    const measure = () => {
      const v = ruler.getComputedTextLength();
      if (Number.isFinite(v) && v > 0) span = v;
    };
    measure();
    document.fonts?.ready.then(measure).catch(() => {});

    let visible = true;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) visible = e.isIntersecting;
    });
    io.observe(host);

    let raf = 0;
    let travelled = 0;
    let last = performance.now();

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible) return;
      if (span <= 0) {
        measure();
        return;
      }

      travelled = (travelled + SPEED * dt) % span;
      tp.setAttribute("startOffset", String(-travelled));
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  // The curve. Deliberately not symmetrical: it dips, climbs past the middle
  // and settles, so no two stretches of it read the same.
  const d =
    "M-30 196 C 80 96 190 72 300 124 C 400 171 452 236 560 214 C 664 193 712 104 830 96 C 906 91 962 118 1030 156";

  const band = tone === "teal" ? "var(--teal)" : "var(--ink)";
  const ink = "var(--cream)";
  const jp = tone === "teal" ? "var(--lime)" : "var(--azure)";

  const run = Array.from({ length: REPEATS }, (_, r) => items.map((s, i) => ({ s, i, r }))).flat();

  return (
    <svg
      ref={hostRef}
      /* The path runs from x=-30 to x=1030, so the box has to contain it.
         Leaving it at 0..1000 let the stroke and its round caps paint outside
         the element and collide with whatever sat beside the band. */
      viewBox="-40 0 1090 300"
      /* slice, not meet: on a phone the band is a third of its desktop width,
         and scaling to fit renders the type at about 9px. Covering the box
         instead keeps the type readable and crops the ends of the curve, which
         is the one part of a marquee nobody is reading anyway. */
      preserveAspectRatio="xMidYMid slice"
      className={`ribbon ${className}`}
      role="img"
      aria-label={items.join(", ")}
    >
      <defs>
        <path id={pathId} d={d} fill="none" />
      </defs>

      {/* an offset lime copy first, so a sliver of it shows under the band and
          the ribbon reads as a solid with a lit edge rather than a flat stroke */}
      <use
        href={`#${pathId}`}
        stroke="var(--lime)"
        strokeWidth="62"
        strokeLinecap="round"
        fill="none"
        opacity="0.28"
        transform="translate(0 11)"
      />
      {/* the band itself, the same curve stroked fat */}
      <use href={`#${pathId}`} stroke={band} strokeWidth="62" strokeLinecap="round" fill="none" />

      {/* the ruler: one repeat, laid out straight and hidden, purely to measure */}
      {/* opacity rather than visibility: a visibility:hidden text node is not
          guaranteed to be measurable, and this element exists only to be
          measured. It sits above the viewBox, so the clip hides it anyway. */}
      <text
        ref={rulerRef}
        className="ribbon-text"
        x="0"
        y="-400"
        opacity="0"
        aria-hidden="true"
      >
        {items.map((s) => s + SEP).join("")}
      </text>

      <text className="ribbon-text" dominantBaseline="middle" fill={ink} aria-hidden="true">
        <textPath ref={textPathRef} href={`#${pathId}`} startOffset="0">
          {run.map(({ s, i, r }) => (
            <tspan key={`${r}-${i}`} fill={JP.test(s) ? jp : ink}>
              {s}
              <tspan fill={ink} opacity="0.35">
                {SEP}
              </tspan>
            </tspan>
          ))}
        </textPath>
      </text>
    </svg>
  );
}
