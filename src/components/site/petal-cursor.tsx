"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useSyncExternalStore } from "react";

import {
  getCursorServerSnapshot,
  getCursorSnapshot,
  subscribeCursor,
} from "@/lib/cursor";

/**
 * Cherry blossom on the cursor.
 *
 * Moving the pointer sheds petals, and roughly every sixth spawn opens as a
 * whole five-petal blossom that pops to full size before it falls. Everything
 * is painted into one canvas: the alternative is a DOM node per petal, and a
 * few dozen absolutely positioned elements animating at once is exactly the
 * thing that makes a page feel heavy.
 *
 * It is deliberately quiet about when it runs:
 *
 *   - `prefers-reduced-motion` and the whole thing never mounts a listener.
 *   - No fine pointer (a phone, a tablet) and it never mounts either, because
 *     there is no cursor to decorate and a touch drag would just spray petals.
 *   - The loop stops itself the moment the last petal dies, and a hidden tab
 *     clears the field rather than simulating into nothing.
 *
 * Nothing here re-renders. React mounts one canvas and the effect owns it.
 */

/** Pointer travel, in px, between spawns. Lower is a denser trail. */
const SPAWN_EVERY = 38;

/** Hard cap on live petals, so a fast sweep cannot run the field away. */
const MAX_PETALS = 44;

/** One spawn in this many opens as a full blossom instead of a single petal. */
const BLOOM_EVERY = 6;

/** Downward pull, px per second per second. */
const GRAVITY = 26;

/**
 * Sakura, pitched to be seen.
 *
 * The first pass was pale blush, which is what a cherry blossom actually looks
 * like and which is also invisible on a #F5F1E7 washi ground: the petals
 * painted and nobody could tell. These are mid pinks with one pale highlight,
 * and each petal carries a deeper edge, so it reads on cream and on teal type
 * without turning into confetti.
 */
const TINTS = [
  { fill: "#F9A8C4", edge: "#E07399" },
  { fill: "#F58FB4", edge: "#D4608B" },
  { fill: "#FDC4D8", edge: "#E890B0" },
  { fill: "#FFD9E6", edge: "#EFA4C0" },
  { fill: "#EF7BA8", edge: "#C75383" },
] as const;

type Tint = (typeof TINTS)[number];

type Petal = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** seconds lived, and the total it gets */
  age: number;
  life: number;
  size: number;
  rot: number;
  spin: number;
  /** phase and rate of the side-to-side sway */
  sway: number;
  swayRate: number;
  swayAmp: number;
  /** phase of the flip, which is what makes a flat shape read as a petal */
  flip: number;
  flipRate: number;
  tint: Tint;
  bloom: boolean;
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/**
 * One petal, pointing up, centred on the origin, with the notch in its tip
 * that separates a cherry blossom from a generic leaf.
 */
function petalPath(ctx: CanvasRenderingContext2D, s: number) {
  ctx.beginPath();
  ctx.moveTo(0, s * 0.85);
  ctx.bezierCurveTo(-s * 0.98, s * 0.28, -s * 0.62, -s * 0.86, -s * 0.17, -s * 0.72);
  ctx.quadraticCurveTo(0, -s * 0.46, s * 0.17, -s * 0.72);
  ctx.bezierCurveTo(s * 0.62, -s * 0.86, s * 0.98, s * 0.28, 0, s * 0.85);
  ctx.closePath();
}

export function PetalCursor() {
  const ref = useRef<HTMLCanvasElement>(null);
  // HR Final Boss has its own cursor (a small light trail, not petals). That
  // route's layout mounts LightCursor instead; this one has to know to stand
  // down rather than run both at once.
  const onHrFinalBoss = usePathname().startsWith("/events/hr-final-boss");
  // The switch in the corner. Off unmounts the canvas rather than just pausing
  // the loop, so no half-fallen petal is left frozen on the page.
  const enabled = useSyncExternalStore(
    subscribeCursor,
    getCursorSnapshot,
    getCursorServerSnapshot,
  );

  useEffect(() => {
    if (onHrFinalBoss || !enabled) return;
    const canvas = ref.current;
    if (!canvas) return;

    // Two gates, both hard: no motion wanted, or no cursor to decorate.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const petals: Petal[] = [];
    let spawns = 0;
    let lastX = 0;
    let lastY = 0;
    let seeded = false;
    let travelled = 0;

    const spawn = (x: number, y: number) => {
      if (petals.length >= MAX_PETALS) return;
      spawns += 1;
      const bloom = spawns % BLOOM_EVERY === 0;
      petals.push({
        x,
        y,
        // a small outward push, biased upward, so a petal lifts off the cursor
        // before gravity takes it: dropping straight down reads as a bug
        vx: rand(-26, 26),
        vy: rand(-34, -6),
        age: 0,
        life: bloom ? rand(2.6, 3.6) : rand(1.9, 3.0),
        size: bloom ? rand(8, 12) : rand(6, 10.5),
        rot: rand(0, Math.PI * 2),
        spin: rand(-1.7, 1.7),
        sway: rand(0, Math.PI * 2),
        swayRate: rand(1.1, 2.4),
        swayAmp: rand(10, 30),
        flip: rand(0, Math.PI * 2),
        flipRate: rand(1.4, 3.1),
        tint: TINTS[Math.floor(Math.random() * TINTS.length)],
        bloom,
      });
    };

    let raf = 0;
    let last = performance.now();

    const draw = (p: Petal) => {
      const t = p.age / p.life;

      // Fade in over the first eighth of the life, out over the last third.
      const alpha = t < 0.12 ? t / 0.12 : t > 0.66 ? 1 - (t - 0.66) / 0.34 : 1;

      // Blossoms pop: past full size, then settle. Single petals just appear.
      // Clamped at both ends: the curve overshoots above 1 by design, and the
      // floor is there because a negative scale would be a negative radius
      // below, which canvas throws on rather than ignoring.
      const pop = p.bloom
        ? Math.max(0, Math.min(1, 1.35 * (1 - Math.pow(1 - Math.min(t / 0.18, 1), 3))))
        : 1;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      // The flip is a horizontal squash. A petal turning edge-on in the air is
      // the whole reason this does not look like confetti.
      ctx.scale(Math.cos(p.flip) * 0.75 + 0.25, 1);
      ctx.globalAlpha = Math.max(0, alpha) * 0.94;
      ctx.fillStyle = p.tint.fill;
      ctx.strokeStyle = p.tint.edge;
      ctx.lineWidth = 1;

      const s = p.size * pop;
      if (p.bloom) {
        for (let i = 0; i < 5; i += 1) {
          ctx.save();
          ctx.rotate((i * Math.PI * 2) / 5);
          ctx.translate(0, -s * 0.62);
          petalPath(ctx, s * 0.78);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        ctx.globalAlpha = Math.max(0, alpha) * 0.5;
        ctx.fillStyle = "#FFF6D8";
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        petalPath(ctx, s);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    };

    const tick = (now: number) => {
      // Floored at zero as well as capped. requestAnimationFrame hands back the
      // timestamp from the start of the frame, which can be *earlier* than the
      // performance.now() `start` recorded a moment before it, so the first
      // frame of a restart could run time backwards: a petal's age went
      // slightly negative, the bloom curve went with it, and the highlight
      // circle asked canvas for a negative radius. That throws.
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
      last = now;

      ctx.clearRect(0, 0, w, h);

      for (let i = petals.length - 1; i >= 0; i -= 1) {
        const p = petals[i];
        p.age += dt;
        if (p.age >= p.life || p.y > h + 60) {
          petals.splice(i, 1);
          continue;
        }

        p.vy += GRAVITY * dt;
        // Air drag, frame-rate independent, so a slow frame does not launch it.
        const drag = Math.exp(-1.1 * dt);
        p.vx *= drag;
        p.vy *= drag;

        p.sway += p.swayRate * dt;
        p.flip += p.flipRate * dt;
        p.rot += p.spin * dt;

        p.x += (p.vx + Math.cos(p.sway) * p.swayAmp) * dt;
        p.y += p.vy * dt;

        draw(p);
      }

      // Stop dead when the field empties. A pointer move starts it again.
      if (petals.length === 0) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (!seeded) {
        seeded = true;
        lastX = e.clientX;
        lastY = e.clientY;
        return;
      }
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      travelled += Math.hypot(dx, dy);
      if (travelled < SPAWN_EVERY) return;
      travelled = 0;
      spawn(e.clientX + rand(-6, 6), e.clientY + rand(-6, 6));
      start();
    };

    // A click is a deliberate gesture, so it gets a deliberate little burst.
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      for (let i = 0; i < 3; i += 1) spawn(e.clientX + rand(-10, 10), e.clientY + rand(-10, 10));
      start();
    };

    const onHidden = () => {
      if (!document.hidden) return;
      petals.length = 0;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      ctx.clearRect(0, 0, w, h);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onHidden);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onHidden);
    };
  }, [onHrFinalBoss, enabled]);

  if (onHrFinalBoss || !enabled) return null;

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[55] h-full w-full"
    />
  );
}
