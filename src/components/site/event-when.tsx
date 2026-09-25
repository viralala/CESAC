"use client";

import { useSyncExternalStore } from "react";

import {
  describe,
  googleCalendarUrl,
  phaseAt,
  remaining,
  type CalendarEvent,
} from "@/lib/calendar";
import type { EventSchedule } from "@/lib/data/cesac";

/* --------------------------------------------------------------------------
 * One clock for every countdown on the page
 *
 * Read through useSyncExternalStore rather than a state set from an effect,
 * which this project's lint forbids, and so every countdown on a page ticks
 * off the same interval instead of one each. The server has no clock worth
 * rendering, so it renders nothing and the browser fills the numbers in:
 * a server-rendered countdown would be a second out of date before it left
 * the building, and a mismatch React would complain about.
 * ------------------------------------------------------------------------ */

const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!timer) timer = setInterval(() => listeners.forEach((l) => l()), 1000);
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

const nowSeconds = () => Math.floor(Date.now() / 1000);
const serverNow = () => null;

function useNow(): number | null {
  const s = useSyncExternalStore(subscribe, nowSeconds, serverNow);
  return s === null ? null : s * 1000;
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * When an event is, how long until it starts, and a way to put it in a
 * calendar.
 *
 * Asked for on every event, so it is one component every event surface uses:
 * the events index, the front page, each event's own page and the student
 * console. It says what it knows and nothing more. With no date set it says
 * the date is to be announced and offers no calendar entry, because an entry
 * with a guessed date in it is worse than none. Once the event has ended the
 * countdown and the calendar button go, and it says so.
 *
 * Two ways in: Google Calendar opens in a new tab with the entry filled in,
 * and the .ics file from /calendar/<slug> is what Apple Calendar, Outlook and
 * phones open. Neither is contacted until somebody presses one.
 */
export function EventWhen({
  event,
  schedule,
  tone = "light",
  size = "full",
  showDate = true,
  className = "",
}: {
  event: Omit<CalendarEvent, "schedule">;
  schedule: EventSchedule | null;
  /** "dark" on a dark panel, where the text is cream. */
  tone?: "light" | "dark";
  /** "compact" is one line, for a card that already has a lot on it. */
  size?: "full" | "compact";
  /**
   * Off where the card already prints its own "when" line right above, so
   * the same dates are not said twice in two formats.
   */
  showDate?: boolean;
  className?: string;
}) {
  const now = useNow();
  const phase = now === null ? (schedule ? "upcoming" : "tba") : phaseAt(schedule, now);
  const left = schedule && now !== null ? remaining(schedule, now) : null;
  const dark = tone === "dark";

  const muted = dark ? "text-cream/60" : "text-muted";
  const strong = dark ? "text-cream" : "text-ink";
  const tile = dark ? "bg-cream/10 text-cream" : "bg-cream-2 text-ink";

  const full = schedule ? { ...event, schedule } : null;

  return (
    <div className={`grid gap-3 ${className}`}>
      {showDate ? (
        <p className={`label-sm ${muted}`}>
          {schedule ? describe(schedule) : "Date to be announced"}
          {schedule?.venue ? ` · ${schedule.venue}` : ""}
        </p>
      ) : null}

      {phase === "upcoming" && size === "full" ? (
        <div className="flex flex-wrap items-center gap-2" aria-live="off">
          <span className="sr-only">Starts in</span>
          {(
            [
              ["days", left?.days],
              ["hrs", left?.hours],
              ["min", left?.minutes],
              ["sec", left?.seconds],
            ] as const
          ).map(([unit, value]) => (
            <span
              key={unit}
              className={`grid min-w-[3.6rem] place-items-center rounded-[var(--r-sm)] px-2.5 py-2 ${tile}`}
            >
              <span className="d-tall text-[1.6rem] leading-none tabular-nums">
                {value === undefined ? "--" : unit === "days" ? value : pad(value)}
              </span>
              <span className={`label-sm mt-1 text-[0.55rem] ${muted}`}>{unit}</span>
            </span>
          ))}
        </div>
      ) : null}

      {phase === "upcoming" && size === "compact" ? (
        <p className={`label ${strong}`}>
          {left
            ? `Starts in ${left.days}d ${pad(left.hours)}h ${pad(left.minutes)}m ${pad(left.seconds)}s`
            : "Counting down"}
        </p>
      ) : null}

      {phase === "live" ? (
        <p className="label-sm w-fit rounded-full bg-lime px-3.5 py-1.5 text-[var(--on-pop)]">
          Happening now
        </p>
      ) : null}

      {phase === "over" ? <p className={`label-sm ${muted}`}>This one has wrapped.</p> : null}

      {full && phase !== "over" ? (
        <details className="group relative w-fit">
          <summary
            className={`label inline-flex cursor-pointer list-none items-center gap-2 rounded-full border-2 px-4 py-2 transition-colors [&::-webkit-details-marker]:hidden ${
              dark
                ? "border-cream/40 text-cream hover:bg-cream hover:text-teal-2"
                : "border-ink/20 text-ink hover:border-ink hover:bg-ink hover:text-cream"
            }`}
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.6}>
              <rect x="1.8" y="2.8" width="12.4" height="11.4" rx="2" />
              <path d="M1.8 6.4h12.4M5 1.4v2.8M11 1.4v2.8" strokeLinecap="round" />
            </svg>
            Add to calendar
          </summary>
          <div className="absolute left-0 top-full z-40 mt-2 grid w-64 gap-1 rounded-[var(--r-md)] border-2 border-ink/10 bg-white p-2 shadow-[var(--sh-3)]">
            <a
              href={googleCalendarUrl(full)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[var(--r-sm)] px-3 py-2.5 text-[0.92rem] text-ink transition-colors hover:bg-cream-2"
            >
              Google Calendar
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <a
              href={`/calendar/${event.slug}`}
              download={`${event.slug}.ics`}
              className="rounded-[var(--r-sm)] px-3 py-2.5 text-[0.92rem] text-ink transition-colors hover:bg-cream-2"
            >
              Apple, Outlook or your phone
              <span className="label-sm ml-2 text-muted">.ics</span>
            </a>
          </div>
        </details>
      ) : null}

      {!full ? (
        <p className={`serif-it text-[0.88rem] leading-snug ${muted}`}>
          A countdown and a calendar entry appear here once the date is set.
        </p>
      ) : null}
    </div>
  );
}
