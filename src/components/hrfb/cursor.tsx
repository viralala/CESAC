"use client";

import { useEffect, useRef } from "react";

/**
 * The HR Final Boss cursor: a little light, and only a little.
 *
 * The brief asked for something tied to this page rather than the site-wide
 * cherry blossom, and asked for it to stay light. So this sheds sparse
 * glowing motes instead of petals, at roughly half the density of the
 * blossom trail, and a click strikes a small four-point spark rather than a
 * burst of anything bigger. Nothing here is figurative; it is the same
 * "no character" rule the rest of the site holds, just applied to a cursor
 * effect instead of a hero.
 *
 * Same two hard gates as the blossom trail: prefers-reduced-motion and no
 * fine pointer both skip mounting the loop entirely, and a hidden tab clears
 * the field rather than animating into nothing.
 */

const SPAWN_EVERY = 58;
const MAX_MOTES = 20;
const RISE = 14;

const TINTS = ["#007fff", "#73c2fb", "#e3f1ff", "#ffffff"] as const;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

type Mote = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  tint: string;
  spark: boolean;
  rot: number;
};

export function LightCursor() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

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

    const motes: Mote[] = [];
    let lastX = 0;
    let lastY = 0;
    let seeded = false;
    let travelled = 0;

    const spawn = (x: number, y: number, spark = false) => {
      if (motes.length >= MAX_MOTES) return;
      motes.push({
        x,
        y,
        vx: rand(-8, 8),
        vy: rand(-RISE - 6, -RISE + 6),
        age: 0,
        life: spark ? rand(0.4, 0.6) : rand(0.6, 1.1),
        size: spark ? rand(5, 8) : rand(1.6, 3.2),
        tint: TINTS[Math.floor(Math.random() * TINTS.length)],
        spark,
        rot: rand(0, Math.PI * 2),
      });
    };

    let raf = 0;
    let last = performance.now();

    const drawGlow = (m: Mote, alpha: number) => {
      const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.size * 3.2);
      g.addColorStop(0, m.tint);
      g.addColorStop(1, "transparent");
      ctx.globalAlpha = alpha;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.size * 3.2, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawSpark = (m: Mote, alpha: number) => {
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.rot);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = m.tint;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-m.size, 0);
      ctx.lineTo(m.size, 0);
      ctx.moveTo(0, -m.size);
      ctx.lineTo(0, m.size);
      ctx.stroke();
      ctx.restore();
    };

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      ctx.clearRect(0, 0, w, h);

      for (let i = motes.length - 1; i >= 0; i -= 1) {
        const m = motes[i];
        m.age += dt;
        if (m.age >= m.life) {
          motes.splice(i, 1);
          continue;
        }

        const t = m.age / m.life;
        const alpha = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;

        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.vy += 6 * dt;

        if (m.spark) drawSpark(m, Math.max(0, alpha) * 0.85);
        else drawGlow(m, Math.max(0, alpha) * 0.7);
      }
      ctx.globalAlpha = 1;

      if (motes.length === 0) {
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
      spawn(e.clientX, e.clientY);
      start();
    };

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      spawn(e.clientX, e.clientY, true);
      start();
    };

    const onHidden = () => {
      if (!document.hidden) return;
      motes.length = 0;
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
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[55] h-full w-full"
    />
  );
}
