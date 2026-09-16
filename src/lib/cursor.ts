/**
 * The cursor decoration preference.
 *
 * One switch behind both trails: the site-wide cherry blossom and HR Final
 * Boss's light trail. Turning it off stops whichever one the current route
 * would have run, and the answer is remembered.
 *
 * Same shape as the music preference in `audio.ts`, and for the same reasons:
 * one key in localStorage rather than a cookie, because it is a UI preference
 * that never needs to travel with a request, and it is read through
 * useSyncExternalStore rather than an effect so the button never renders in
 * the wrong state first and then corrects itself.
 */

const KEY = "cesac.cursor";

/** On unless someone has said otherwise: the trail was asked for by name. */
const DEFAULT_ON = true;

export function readEnabled(): boolean {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === "on") return true;
    if (raw === "off") return false;
    return DEFAULT_ON;
  } catch {
    return DEFAULT_ON;
  }
}

function writeEnabled(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // Private mode. The choice still holds for this page view.
  }
}

let enabled: boolean | null = null;
const listeners = new Set<() => void>();

export function subscribeCursor(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getCursorSnapshot(): boolean {
  if (enabled === null) enabled = readEnabled();
  return enabled;
}

/**
 * The server knows nothing about localStorage, and this has to be a stable
 * value rather than a fresh read, or React reports an infinite loop.
 */
export function getCursorServerSnapshot(): boolean {
  return DEFAULT_ON;
}

export function setCursorEnabled(on: boolean) {
  enabled = on;
  writeEnabled(on);
  for (const l of listeners) l();
}

/* --------------------------------------------------------------------------
 * Whether a trail could run here at all
 *
 * The same two gates both trails already apply: someone who asked for less
 * motion does not get any, and a touch screen has no cursor to decorate. The
 * toggle reads this so it can stay out of the way rather than offering a
 * switch that controls nothing.
 *
 * Read through useSyncExternalStore like everything else above, because the
 * alternative is setting state from an effect, which this project's lint
 * forbids and which would flash the button in before hiding it again. The
 * snapshot has to be a cached value rather than a fresh matchMedia read, or
 * React sees a new answer every call and loops.
 * ------------------------------------------------------------------------ */

const QUERIES = ["(prefers-reduced-motion: reduce)", "(hover: hover) and (pointer: fine)"] as const;

let possible: boolean | null = null;

function computePossible(): boolean {
  const [reduced, fine] = QUERIES.map((q) => window.matchMedia(q));
  return !reduced.matches && fine.matches;
}

export function subscribeCursorPossible(cb: () => void) {
  const lists = QUERIES.map((q) => window.matchMedia(q));
  const onChange = () => {
    possible = computePossible();
    cb();
  };
  for (const l of lists) l.addEventListener("change", onChange);
  return () => {
    for (const l of lists) l.removeEventListener("change", onChange);
  };
}

export function getCursorPossibleSnapshot(): boolean {
  if (possible === null) possible = computePossible();
  return possible;
}

/** Nothing renders during the server pass; the client decides. */
export function getCursorPossibleServerSnapshot(): boolean {
  return false;
}
