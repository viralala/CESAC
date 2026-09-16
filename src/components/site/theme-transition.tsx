"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

/**
 * The curtain between the three themes.
 *
 * This site is not one look. The community pages are cream and teal, Attack on
 * Token is the sponsorship deck's parchment and crimson under a sunset hero,
 * and HR Final Boss is blue grid. Crossing between them used to be a single
 * frame in which every colour on the page changed at once, which reads as a
 * glitch rather than as arriving somewhere; this puts a held beat in the
 * middle so the change is something you watch happen.
 *
 * The beat is painted in the theme you are arriving in, not the one you are
 * leaving, because the point of it is the introduction.
 *
 * Only zone crossings play. Moving between two community pages, or between
 * two pages of the same event, changes nothing about the palette and does not
 * deserve a full-screen interruption.
 *
 * Nothing here is React state. The pathname is the only input and the sheets
 * are driven straight through refs and the Web Animations API, so a
 * navigation costs no re-render of the tree underneath and a second
 * navigation mid-flight simply cancels the first.
 */

type Zone = "site" | "aot" | "hrfb";

function zoneOf(pathname: string): Zone {
  if (pathname.startsWith("/events/attack-on-token")) return "aot";
  if (pathname.startsWith("/events/hr-final-boss")) return "hrfb";
  return "site";
}

/**
 * The sheet has to be covering the screen before the browser paints the route
 * it is covering, or the first frame of the new theme shows through underneath
 * it. That is what a layout effect is for. It does nothing during the server
 * pass, and React says so out loud, so the server gets the passive one — there
 * is no navigation to cover there anyway.
 */
const useCurtainEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Label in, hold, then the sheet lifts. Roughly nine tenths of a second. */
const LABEL_IN = 220;
const HOLD_UNTIL = 440;
const WIPE = 460;

function Sheet({
  sheetRef,
  ground,
  children,
}: {
  sheetRef: RefObject<HTMLDivElement | null>;
  ground: string;
  children: React.ReactNode;
}) {
  return (
    <div
      ref={sheetRef}
      aria-hidden="true"
      className={`${ground} pointer-events-none fixed inset-0 z-[100] grid place-items-center`}
      style={{ opacity: 0, visibility: "hidden" }}
    >
      <div data-label className="px-6 text-center">
        {children}
      </div>
    </div>
  );
}

export function ThemeTransition() {
  const pathname = usePathname();

  const site = useRef<HTMLDivElement>(null);
  const aot = useRef<HTMLDivElement>(null);
  const hrfb = useRef<HTMLDivElement>(null);
  // Null until the first navigation: arriving on a page is not a crossing.
  const from = useRef<Zone | null>(null);

  useCurtainEffect(() => {
    const zone = zoneOf(pathname);
    const previous = from.current;
    from.current = zone;

    if (previous === null || previous === zone) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // A background tab freezes the document timeline, so a curtain raised in
    // one would sit at its first frame until the tab came back and then play
    // to an audience that missed the arrival anyway. Nothing to introduce.
    if (document.hidden) return;

    const sheet = { site: site.current, aot: aot.current, hrfb: hrfb.current }[zone];
    if (!sheet) return;
    const label = sheet.querySelector<HTMLElement>("[data-label]");

    // Declared before the animations it cancels and called only after them, so
    // the closure is always looking at initialised bindings.
    //
    // The cancel is not tidiness. Both animations fill "both", so a finished
    // one goes on holding its last frame — clip-path: inset(0 0 100%) — over
    // the sheet's own styles, and a new one is created on every crossing. Left
    // alone they stack up and the sheet is never really its base self again.
    const reset = () => {
      labelAnim?.cancel();
      wipe.cancel();
      sheet.style.visibility = "hidden";
      sheet.style.opacity = "0";
    };

    sheet.style.visibility = "visible";
    sheet.style.opacity = "1";

    const labelAnim = label?.animate(
      [
        { opacity: 0, transform: "translateY(18px) scale(0.98)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: LABEL_IN, easing: "cubic-bezier(0.2,0.8,0.3,1)", fill: "both" },
    );

    // Held at the first keyframe through the delay, so the sheet stays solid
    // while the label settles and only then lifts off the top of the screen.
    const wipe = sheet.animate(
      [{ clipPath: "inset(0 0 0% 0)" }, { clipPath: "inset(0 0 100% 0)" }],
      {
        duration: WIPE,
        delay: HOLD_UNTIL,
        easing: "cubic-bezier(0.76,0,0.24,1)",
        fill: "both",
      },
    );

    wipe.finished.then(reset).catch(() => {
      // Cancelled by a second navigation. That cleanup has already reset it.
    });

    // The one failure mode that matters here is a curtain that never lifts,
    // which would leave a full-screen sheet over a page nobody can see past.
    // Whatever happens to the animation — a timeline that stops advancing, a
    // promise that never settles — this takes it down.
    const failsafe = window.setTimeout(reset, HOLD_UNTIL + WIPE + 600);

    return () => {
      window.clearTimeout(failsafe);
      reset();
    };
  }, [pathname]);

  return (
    <>
      {/* text-center on each line rather than on the wrapper: the base layer
          justifies every paragraph on this site, and a rule that lands on the
          element beats alignment inherited from its parent. */}
      <Sheet sheetRef={site} ground="washi">
        <p className="d-wide text-center text-[clamp(2.4rem,9vw,5.5rem)] leading-none text-teal">
          CE<span className="text-ink">SAC</span>
        </p>
        <p className="jp mt-4 text-center text-[clamp(1rem,2.4vw,1.6rem)] text-ink/45">
          学生委員会
        </p>
      </Sheet>

      <Sheet sheetRef={aot} ground="deck-sky">
        <p className="jp text-center text-[clamp(1.1rem,3vw,2rem)] leading-none text-[#f0a132d9]">
          進撃の
        </p>
        <p
          className="mt-3 text-center text-[clamp(2rem,8vw,5rem)] font-bold uppercase leading-none tracking-[-0.015em] text-cream"
          style={{ fontFamily: "var(--font-oswald)" }}
        >
          Attack on <span className="text-[var(--poster-amber)]">Token</span>
        </p>
      </Sheet>

      <Sheet sheetRef={hrfb} ground="grid-box-deep">
        <p className="hb-display text-center text-[clamp(2rem,8vw,5rem)] text-[var(--hb-sky)]">
          HR <span className="text-[var(--hb-azure)]">Final Boss</span>
        </p>
        <p className="hb-cursive mt-3 text-center text-[clamp(1rem,2.4vw,1.5rem)] text-[var(--hb-maya)]">
          loading the encounter
        </p>
      </Sheet>
    </>
  );
}
