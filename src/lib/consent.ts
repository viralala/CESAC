/**
 * Consent state.
 *
 * Today this site loads no analytics, sets no cookies and embeds no
 * third-party scripts, so there is nothing to gate and the notice is
 * informational. `OPTIONAL_TRACKERS` is the switch that turns it into a real
 * consent gate: set NEXT_PUBLIC_ANALYTICS to the provider you add, and the
 * notice grows an explicit allow/decline before anything can load.
 *
 * Read through useSyncExternalStore rather than an effect, so the banner never
 * flashes for someone who already answered and the read never triggers a
 * cascading render.
 *
 * The answer lives in localStorage, not a cookie. Storing a consent decision in
 * a cookie means setting a cookie in order to ask whether you may set cookies.
 */

const KEY = "cesac.consent";

export type Consent = "granted" | "denied";

/** Server render and first paint: not known yet, so show nothing. */
export const PENDING = "pending";

export type ConsentState = Consent | null | typeof PENDING;

/**
 * Whether anything on the site actually needs consent. Empty string, which is
 * what an unset env var gives, means no.
 */
export const OPTIONAL_TRACKERS = (process.env.NEXT_PUBLIC_ANALYTICS ?? "") !== "";

let cached: ConsentState = PENDING;
let read = false;
const listeners = new Set<() => void>();

export function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getSnapshot(): ConsentState {
  if (!read) {
    read = true;
    try {
      const v = localStorage.getItem(KEY);
      cached = v === "granted" || v === "denied" ? v : null;
    } catch {
      // Private mode, or storage blocked. Treat as unanswered but do not keep
      // asking on every navigation: the write below will fail quietly too.
      cached = null;
    }
  }
  return cached;
}

export function getServerSnapshot(): ConsentState {
  return PENDING;
}

export function setConsent(value: Consent) {
  cached = value;
  read = true;
  try {
    localStorage.setItem(KEY, value);
  } catch {
    // Nothing to do. The banner still closes for this session.
  }
  for (const l of listeners) l();
}

/** True only when the visitor has actively allowed optional scripts. */
export function mayLoadTrackers(state: ConsentState) {
  return OPTIONAL_TRACKERS && state === "granted";
}
