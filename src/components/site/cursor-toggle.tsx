"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import {
  getCursorPossibleServerSnapshot,
  getCursorPossibleSnapshot,
  getCursorServerSnapshot,
  getCursorSnapshot,
  setCursorEnabled,
  subscribeCursor,
  subscribeCursorPossible,
} from "@/lib/cursor";

/**
 * The switch for the cursor trail.
 *
 * Bottom right, and on Attack on Token it stacks directly above the music
 * box's button rather than landing on top of it. That route is the only one
 * that mounts the music widget, so it is the only one that needs the offset.
 *
 * It renders nothing where a trail could not run anyway: reduced motion, or a
 * touch screen with no cursor to decorate. A control that does nothing is
 * worse than no control.
 */

function BlossomIcon({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[1.05rem] w-[1.05rem]" aria-hidden="true">
      <g fill="currentColor">
        {[0, 1, 2, 3, 4].map((i) => (
          <ellipse
            key={i}
            cx="12"
            cy="7.4"
            rx="2.5"
            ry="4"
            transform={`rotate(${i * 72} 12 12)`}
            opacity={off ? 0.55 : 1}
          />
        ))}
      </g>
      <circle cx="12" cy="12" r="1.6" fill="currentColor" opacity={off ? 0.35 : 0.6} />
      {off ? (
        <line
          x1="4.2"
          y1="19.8"
          x2="19.8"
          y2="4.2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ) : null}
    </svg>
  );
}

export function CursorToggle() {
  const on = useSyncExternalStore(subscribeCursor, getCursorSnapshot, getCursorServerSnapshot);
  const possible = useSyncExternalStore(
    subscribeCursorPossible,
    getCursorPossibleSnapshot,
    getCursorPossibleServerSnapshot,
  );

  // The music box sits at bottom-3 / sm:bottom-5 and is 2.75rem tall, so this
  // clears it by a little over half a step on the one route that has it.
  const stacked = usePathname() === "/events/attack-on-token";

  if (!possible) return null;

  return (
    <button
      type="button"
      onClick={() => setCursorEnabled(!on)}
      aria-pressed={on}
      title={on ? "Turn off the cursor blossom" : "Turn on the cursor blossom"}
      className={`fixed right-3 z-[60] grid h-9 w-9 place-items-center rounded-full border border-ink/12 bg-cream text-ink shadow-[0_10px_24px_-10px_rgba(12,20,24,0.55)] transition-colors hover:bg-cream-2 sm:right-5 ${
        stacked ? "bottom-[4.1rem] sm:bottom-[4.6rem]" : "bottom-3 sm:bottom-5"
      }`}
    >
      <span className="sr-only">
        {on ? "Turn off the cursor blossom" : "Turn on the cursor blossom"}
      </span>
      <BlossomIcon off={!on} />
    </button>
  );
}
