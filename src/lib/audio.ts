/**
 * The event soundtrack.
 *
 * Scoped to Attack on Token and nowhere else: the track is mounted by that
 * route's layout, so navigating away unmounts the element and the audio stops
 * on its own rather than needing to be told to.
 *
 * The file is served from this origin like everything else. No embed, no
 * third-party player, no request leaves the site to play it.
 */

export const TRACK = {
  /**
   * A three minute excerpt, frame-cut from the master in `New inspo/`, which
   * is 3h18m and 169 MB and cannot be deployed. See `public/audio/README.md`,
   * which also carries the licensing question this file does not answer.
   */
  src: "/audio/attack-on-token.mp3",
  /** Shown in the widget so a visitor knows what is playing before they play it. */
  title: "Attack on Token theme",
  /**
   * Starting level, 0 to 100. Low on purpose: nobody asked for this to arrive
   * at full volume, and the crank exists for anyone who wants more.
   */
  defaultVolume: 35,
  /** Seconds to ramp in, so starting playback is never a jump scare. */
  fadeSeconds: 1.2,
  /**
   * Whether a first-time visitor gets the track without asking for it.
   *
   * Every browser blocks audible autoplay until the visitor has interacted
   * with the page, so "true" really means: start at the first click or key
   * press. That is the convention for an event page and it is what was asked
   * for, but it is one word to reverse if it ever feels like too much.
   */
  autoStart: true,
} as const;

/* --------------------------------------------------------------------------
 * Preference
 *
 * Two keys in localStorage, no cookie. Same reasoning as the consent store:
 * this is a UI preference, it never leaves the browser, and a cookie would
 * put it on every request for no reason. Both keys are listed on /privacy.
 * ------------------------------------------------------------------------ */

const WANT_KEY = "cesac.music";
const VOL_KEY = "cesac.music.volume";

export function readWanted(): boolean {
  try {
    const raw = localStorage.getItem(WANT_KEY);
    // An explicit answer always wins, and "off" is remembered forever: someone
    // who silenced this once should never have to silence it twice.
    if (raw === "on") return true;
    if (raw === "off") return false;
    return TRACK.autoStart;
  } catch {
    return TRACK.autoStart;
  }
}

export function readAnswered(): boolean {
  try {
    return localStorage.getItem(WANT_KEY) !== null;
  } catch {
    return false;
  }
}

export function writeWanted(on: boolean) {
  try {
    localStorage.setItem(WANT_KEY, on ? "on" : "off");
  } catch {
    // Private mode. The choice still holds for this page view.
  }
}

export function readVolume(): number {
  try {
    const raw = localStorage.getItem(VOL_KEY);
    // Not `Number(raw)` on its own: Number(null) is 0, so an unset key would
    // read back as a valid "silent" and every first visit would start muted.
    if (raw === null) return TRACK.defaultVolume;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0 || n > 100) return TRACK.defaultVolume;
    return Math.round(n);
  } catch {
    return TRACK.defaultVolume;
  }
}

export function writeVolume(v: number) {
  try {
    localStorage.setItem(VOL_KEY, String(Math.round(v)));
  } catch {
    // As above.
  }
}

/* --------------------------------------------------------------------------
 * The readout
 * ------------------------------------------------------------------------ */

/**
 * What the crank says at each level. The control is meant to be fun to wind,
 * so the number gets a running commentary instead of a bare percentage.
 */
const LADDER: readonly [number, string][] = [
  [0, "silent as a library"],
  [15, "mouse volume"],
  [30, "polite"],
  [50, "committee approved"],
  [70, "lecture hall"],
  [85, "the neighbours know"],
  [95, "structurally unwise"],
  [100, "rumbling"],
];

export function volumeLabel(v: number): string {
  let label = LADDER[0][1];
  for (const [floor, text] of LADDER) {
    if (v >= floor) label = text;
  }
  return label;
}

/* --------------------------------------------------------------------------
 * The preference store
 *
 * Read through useSyncExternalStore rather than an effect, the same way
 * `consent.ts` reads its answer: localStorage does not exist during the server
 * render, and setting state from an effect to paper over that is both a lint
 * violation here and a guaranteed flash of the wrong control.
 * ------------------------------------------------------------------------ */

export type MusicPrefs = { wanted: boolean; volume: number };

/** Stable object for the server render. Must not be rebuilt per call. */
const SERVER_PREFS: MusicPrefs = { wanted: false, volume: TRACK.defaultVolume };

let prefs: MusicPrefs | null = null;
const listeners = new Set<() => void>();

export function subscribeMusic(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getMusicSnapshot(): MusicPrefs {
  if (!prefs) prefs = { wanted: readWanted(), volume: readVolume() };
  return prefs;
}

export function getMusicServerSnapshot(): MusicPrefs {
  return SERVER_PREFS;
}

function emit() {
  for (const l of listeners) l();
}

export function setWanted(on: boolean) {
  prefs = { ...getMusicSnapshot(), wanted: on };
  writeWanted(on);
  emit();
}

/**
 * `persist` is false while the crank is being turned and true when it is let
 * go, so winding from 0 to 100 is one storage write rather than a hundred.
 */
export function setVolume(v: number, persist = false) {
  const clamped = Math.max(0, Math.min(100, Math.round(v)));
  prefs = { ...getMusicSnapshot(), volume: clamped };
  if (persist) writeVolume(clamped);
  emit();
}
