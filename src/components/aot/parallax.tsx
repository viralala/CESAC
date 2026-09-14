"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * The depth rig.
 *
 * The scene writes two damped numbers onto itself as custom properties, and
 * every layer inside reads them:
 *
 *   --px, --py   pointer, -1 to 1, relative to the scene box
 *   --sy         how far the scene has travelled up the viewport, -1 to 1
 *
 * Layers move by `calc(var(--px) * var(--dx))`, so a pointer move repaints
 * transforms only. Nothing re-renders, which is what keeps a six-layer hero
 * cheap enough to run on a phone.
 *
 * Reduced motion parks every number at zero and stops the loop, so the art
 * still stacks correctly, it just stops breathing.
 */

const DAMP = 6;

export function ParallaxScene({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    // target values, written by listeners; current values, eased toward them
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let sy = 0;
    let visible = true;
    let last = performance.now();
    let raf = 0;

    const onPointer = (e: PointerEvent) => {
      // Normalised against the viewport rather than the scene box: the figure
      // should acknowledge the cursor anywhere on the page, not only when the
      // pointer happens to be over the artwork.
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
    };

    const onScroll = () => {
      const r = el.getBoundingClientRect();
      const mid = r.top + r.height / 2;
      sy = Math.max(-1, Math.min(1, (mid - window.innerHeight / 2) / window.innerHeight));
    };

    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) visible = entry.isIntersecting;
    });
    io.observe(el);

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!visible) return;

      // frame-rate independent exponential easing
      const k = 1 - Math.exp(-DAMP * dt);
      cx += (tx - cx) * k;
      cy += (ty - cy) * k;

      el.style.setProperty("--px", cx.toFixed(4));
      el.style.setProperty("--py", cy.toFixed(4));
      el.style.setProperty("--sy", sy.toFixed(4));
    };

    onScroll();
    raf = requestAnimationFrame(tick);
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div ref={ref} className={`px-scene ${className}`} style={style}>
      {children}
    </div>
  );
}

/**
 * One plane in the stack.
 *
 * `depth` is how many pixels the layer travels at full pointer deflection.
 * Give the back of the scene single digits and the front of it twenty-odd, and
 * the gap between them is the whole illusion. `tilt` adds a little rotation on
 * top for the layers that should feel like they have a face turning.
 */
export function ParallaxLayer({
  depth = 10,
  depthY,
  tilt = 0,
  drift = 0,
  className = "",
  style,
  children,
}: {
  depth?: number;
  depthY?: number;
  /** degrees of yaw/pitch at full deflection */
  tilt?: number;
  /** pixels of scroll-driven vertical drift */
  drift?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      className={`px-layer ${className}`}
      style={
        {
          "--dx": `${depth}px`,
          "--dy": `${depthY ?? depth * 0.62}px`,
          "--tilt": `${tilt}deg`,
          "--drift": `${drift}px`,
          ...style,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
