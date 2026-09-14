"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import {
  TRACK,
  getMusicServerSnapshot,
  getMusicSnapshot,
  setVolume,
  setWanted,
  subscribeMusic,
  volumeLabel,
} from "@/lib/audio";

/**
 * The music box.
 *
 * Bottom right: one small button that starts and stops the track, and a crank
 * that sets the volume. The crank is a joke with a working mechanism behind
 * it. You cannot drag it like a slider. You have to wind it, in circles, and a
 * full revolution only buys you a third of the range, so getting from quiet to
 * loud is about three turns of honest labour.
 *
 * The joke has a hard limit, though: a control that is only funny is a control
 * that is broken. So the knob is a real ARIA slider, it takes arrow keys,
 * Home, End and Page Up/Down like any other slider, and every one of those
 * moves it in sane steps. The winding is the flavour, not the only way in.
 *
 * It only exists on the Attack on Token route, because that route's layout is
 * the only thing that mounts it. Navigating away unmounts the audio element,
 * which stops playback without anything having to remember to stop it.
 */

/** How much of the range one full revolution of the crank is worth. */
const PERCENT_PER_TURN = 34;

/** How long the panel stays open after you press the button, in ms. */
const FLASH_MS = 3600;

const TICKS = 15;

/**
 * Seconds of ramp at each end of the track.
 *
 * The file is an excerpt cut on frame boundaries, so it does not end on a
 * musical resolution and `loop` restarts it instantly. Without this the seam
 * is an audible click every time round.
 */
const LOOP_FADE = 2;

/** Knob scale sweep: a real knob leaves a gap at the bottom, so this one does. */
const SWEEP = 270;
const START_ANGLE = -135;

/** Shortest signed distance between two angles, in radians. */
function angleDelta(to: number, from: number) {
  let d = to - from;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[1.15rem] w-[1.15rem]" aria-hidden="true">
      <path
        d="M4 9.5h3.2L12 5.4v13.2L7.2 14.5H4z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {muted ? (
        <g stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
          <line x1="16" y1="9.6" x2="20.6" y2="14.4" />
          <line x1="20.6" y1="9.6" x2="16" y2="14.4" />
        </g>
      ) : (
        <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M15.6 9.2a4 4 0 0 1 0 5.6" />
          <path d="M18.3 6.8a7.7 7.7 0 0 1 0 10.4" />
        </g>
      )}
    </svg>
  );
}

export function MusicBox() {
  const prefs = useSyncExternalStore(subscribeMusic, getMusicSnapshot, getMusicServerSnapshot);
  const { wanted, volume } = prefs;

  const audioRef = useRef<HTMLAudioElement>(null);
  const gainRaf = useRef(0);
  /** 0 to 1, the opening ramp, so starting playback is never a jump scare. */
  const intro = useRef(0);
  const introAt = useRef(0);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [playing, setPlaying] = useState(false);
  /** The file is not there, or the browser cannot decode it. Render nothing. */
  const [broken, setBroken] = useState(false);
  const [open, setOpen] = useState(false);

  /** Visual rotation of the disc, in degrees. Free running, so it can overwind. */
  const [spin, setSpin] = useState(0);
  const [overwound, setOverwound] = useState(false);

  const dragging = useRef(false);
  const lastAngle = useRef(0);
  /** Mirrors `dragging` for the hint line, which is rendered rather than read. */
  const [winding, setWinding] = useState(false);

  // The store is the source of truth for the level, so handlers read it back
  // rather than closing over a render's copy or mirroring it into a ref.
  const currentVolume = () => getMusicSnapshot().volume;

  /* ----------------------------------------------------------- playback -- */

  /**
   * The one place that decides the element's volume.
   *
   * Three things multiply: the level the listener set, the opening ramp, and a
   * ramp at each end of the file so the loop seam does not click. Anything
   * that wants to change the volume changes an input and calls this, because
   * two things writing `el.volume` independently is how you get a fight.
   *
   * Clamped, not trusted: multiplying in-range numbers still lands a few
   * ten-thousandths outside [0,1], and HTMLMediaElement throws an
   * IndexSizeError rather than rounding. It did.
   */
  const applyGain = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    const d = el.duration;
    let seam = 1;
    if (Number.isFinite(d) && d > LOOP_FADE * 2.5) {
      const t = el.currentTime;
      if (t < LOOP_FADE) seam = t / LOOP_FADE;
      else if (d - t < LOOP_FADE) seam = (d - t) / LOOP_FADE;
    }
    const v = (getMusicSnapshot().volume / 100) * intro.current * seam;
    el.volume = Math.max(0, Math.min(1, v));
  }, []);

  /**
   * Drives the gain while the track plays and stops itself when it does not.
   * `timeupdate` fires about four times a second, which is far too coarse to
   * ramp over two seconds without stepping audibly.
   */
  const runGain = useCallback(() => {
    cancelAnimationFrame(gainRaf.current);
    intro.current = 0;
    introAt.current = performance.now();
    const step = () => {
      const el = audioRef.current;
      const ms = TRACK.fadeSeconds * 1000;
      intro.current = ms <= 0 ? 1 : Math.min(1, (performance.now() - introAt.current) / ms);
      applyGain();
      if (el && !el.paused) gainRaf.current = requestAnimationFrame(step);
    };
    gainRaf.current = requestAnimationFrame(step);
  }, [applyGain]);

  // Media `error` does not bubble, so React's onError on <audio> is not a
  // dependable signal: a 404 on the track sets el.error and never reaches the
  // prop. Listen on the element itself instead, which is the only version of
  // this that actually fires.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const fail = () => setBroken(true);
    el.addEventListener("error", fail);
    return () => el.removeEventListener("error", fail);
  }, []);

  // Start, or arm a start. Browsers refuse audible playback until the visitor
  // has interacted with the page, so a refused play() is expected rather than
  // an error: we wait for the first click or key press and try once more.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !wanted || broken) return;

    let cancelled = false;
    let armed = false;

    const begin = () => {
      if (cancelled) return;
      el.volume = 0;
      el.play()
        .then(() => {
          if (cancelled) return;
          setPlaying(true);
          runGain();
        })
        .catch(() => {
          if (el.error) {
            setBroken(true);
            return;
          }
          arm();
        });
    };

    function arm() {
      if (cancelled || armed) return;
      armed = true;
      const once = () => {
        window.removeEventListener("pointerdown", once);
        window.removeEventListener("keydown", once);
        armed = false;
        begin();
      };
      window.addEventListener("pointerdown", once, { once: true });
      window.addEventListener("keydown", once, { once: true });
    }

    begin();
    return () => {
      cancelled = true;
      cancelAnimationFrame(gainRaf.current);
    };
  }, [wanted, broken, runGain]);

  // A backgrounded tab should not keep playing. Resume only if it was playing.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onVisibility = () => {
      if (document.hidden) {
        el.pause();
      } else if (wanted && playing) {
        void el.play().then(runGain).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [wanted, playing, runGain]);

  useEffect(() => () => clearTimeout(flashTimer.current), []);

  const flash = () => {
    setOpen(true);
    clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => {
      if (!dragging.current) setOpen(false);
    }, FLASH_MS);
  };

  const toggle = () => {
    const el = audioRef.current;
    flash();
    if (playing) {
      el?.pause();
      setPlaying(false);
      setWanted(false);
      return;
    }
    setWanted(true);
    if (!el) return;
    el.volume = 0;
    el.play()
      .then(() => {
        setPlaying(true);
        runGain();
      })
      .catch(() => {
        setPlaying(false);
        if (el.error) setBroken(true);
      });
  };

  /* -------------------------------------------------------------- crank -- */

  const applyVolume = (next: number, persist: boolean) => {
    setVolume(next, persist);
    applyGain();
  };

  const onKnobDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    lastAngle.current = Math.atan2(e.clientY - cy, e.clientX - cx);
    dragging.current = true;
    setWinding(true);
    setOpen(true);
    // Capture so a wide, sloppy circle keeps winding even when the pointer
    // leaves the knob, which it will: this is a 68px target and the gesture is
    // a circle. Guarded because a pointerId that is no longer active throws.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Winding still works, it just stops if the pointer leaves the knob.
    }
  };

  const onKnobMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const box = e.currentTarget.getBoundingClientRect();
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    const a = Math.atan2(e.clientY - cy, e.clientX - cx);
    const d = angleDelta(a, lastAngle.current);
    lastAngle.current = a;

    const turns = d / (Math.PI * 2);
    setSpin((s) => s + turns * 360);

    const next = currentVolume() + turns * PERCENT_PER_TURN;
    setOverwound(next > 100 || next < 0);
    applyVolume(Math.max(0, Math.min(100, next)), false);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    setWinding(false);
    setOverwound(false);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Already released by the browser.
    }
    applyVolume(currentVolume(), true);
    flash();
  };

  // The way in that is not a joke.
  const onKnobKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step =
      e.key === "PageUp" || e.key === "PageDown" ? 20 : e.shiftKey ? 1 : 5;
    let next: number | null = null;
    if (e.key === "ArrowUp" || e.key === "ArrowRight" || e.key === "PageUp") {
      next = currentVolume() + step;
    } else if (e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "PageDown") {
      next = currentVolume() - step;
    } else if (e.key === "Home") {
      next = 0;
    } else if (e.key === "End") {
      next = 100;
    }
    if (next === null) return;
    e.preventDefault();
    const clamped = Math.max(0, Math.min(100, next));
    setSpin((deg) => deg + ((clamped - currentVolume()) / PERCENT_PER_TURN) * 360);
    applyVolume(clamped, true);
  };

  if (broken) return null;

  const hint = overwound
    ? "that is as far as it goes"
    : winding
      ? "keep winding"
      : "wind it in circles";

  return (
    <div
      className="fixed bottom-3 right-3 z-[60] sm:bottom-5 sm:right-5"
      onPointerEnter={() => setOpen(true)}
      onPointerLeave={() => {
        if (!dragging.current) setOpen(false);
      }}
      onFocus={() => setOpen(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node) && !dragging.current) {
          setOpen(false);
        }
      }}
    >
      <audio
        ref={audioRef}
        src={TRACK.src}
        loop
        preload={wanted ? "auto" : "metadata"}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {/* The panel opens upward, not sideways. Sideways put it straight
          through the hero's toolbar, and the one place this widget must never
          land is on top of the button that registers a team. */}
      <div className="flex flex-col items-end gap-2.5">
        {/* ------------------------------------------------ the crank ---- */}
        <div
          className={`origin-bottom-right transition-all duration-300 ${
            open
              ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
              : "pointer-events-none translate-y-2 scale-95 opacity-0"
          }`}
        >
          <div className="flex items-center gap-3.5 rounded-[var(--r-lg)] border border-ink/10 bg-cream px-3.5 py-3 shadow-[0_14px_30px_-12px_rgba(12,20,24,0.4)]">
            <div
              role="slider"
              tabIndex={0}
              aria-label="Volume. Wind the crank, or use the arrow keys."
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={volume}
              aria-valuetext={`${volume} percent, ${volumeLabel(volume)}`}
              onPointerDown={onKnobDown}
              onPointerMove={onKnobMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              onKeyDown={onKnobKey}
              className="relative h-[4.5rem] w-[4.5rem] shrink-0 cursor-grab touch-none select-none rounded-full bg-cream-2 outline-none ring-offset-2 ring-offset-cream focus-visible:ring-2 focus-visible:ring-teal active:cursor-grabbing"
            >
              {/* the scale: lit up to the current level */}
              {Array.from({ length: TICKS }, (_, i) => {
                const pct = (i / (TICKS - 1)) * 100;
                const lit = volume >= pct && volume > 0;
                return (
                  <span
                    key={i}
                    aria-hidden
                    className="absolute left-1/2 top-1/2 block h-[0.5rem] w-[0.16rem] rounded-full"
                    style={{
                      background: lit ? "var(--teal)" : "rgba(12,20,24,0.2)",
                      transform: `translate(-50%,-50%) rotate(${
                        START_ANGLE + (i / (TICKS - 1)) * SWEEP
                      }deg) translateY(-1.86rem)`,
                    }}
                  />
                );
              })}

              {/* the disc you actually grab, spinning with your winding */}
              <span
                aria-hidden
                className="absolute inset-[0.62rem] rounded-full bg-ink shadow-[inset_0_-3px_8px_rgba(0,0,0,0.45)]"
                style={{ transform: `rotate(${spin}deg)` }}
              >
                <span className="absolute left-1/2 top-[0.32rem] h-[0.62rem] w-[0.14rem] -translate-x-1/2 rounded-full bg-cream/70" />
                <span
                  className="absolute left-1/2 top-[0.2rem] h-[0.62rem] w-[0.62rem] -translate-x-1/2 rounded-full border-2 border-ink"
                  style={{ background: "var(--lime)" }}
                />
              </span>
            </div>

            <div className="min-w-[8.5rem]">
              <p className="d-wide text-[1.6rem] leading-none text-ink">{volume}</p>
              <p className="mt-1 text-[0.78rem] font-semibold leading-tight text-teal">
                {volumeLabel(volume)}
              </p>
              <p className="label-sm mt-1.5 text-muted">{hint}</p>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------ the button ---- */}
        <button
          type="button"
          onClick={toggle}
          aria-pressed={playing}
          title={TRACK.title}
          className={`grid h-11 w-11 place-items-center rounded-full border transition-colors ${
            playing
              ? "border-transparent bg-teal text-cream"
              : "border-ink/12 bg-cream text-ink hover:bg-cream-2"
          } shadow-[0_10px_24px_-10px_rgba(12,20,24,0.55)]`}
        >
          <span className="sr-only">
            {playing ? `Stop ${TRACK.title}` : `Play ${TRACK.title}`}
          </span>
          <SpeakerIcon muted={!playing || volume === 0} />
        </button>
      </div>
    </div>
  );
}
