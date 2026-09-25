/**
 * Light or dark.
 *
 * One key in localStorage, `cesac.theme`, holding "light" or "dark" once the
 * visitor has chosen, and nothing before that: until somebody presses the
 * button the site follows the device's own setting, and keeps following it if
 * the device switches at sunset. Same shape as the cursor and music
 * preferences, and read through useSyncExternalStore for the same reason, so
 * the button never renders in the wrong state first.
 *
 * The attribute that actually switches the palette, `data-theme` on <html>,
 * is set by THEME_SCRIPT in the root layout before the first paint. Setting
 * it from React instead would paint one frame of the light site on a dark
 * device, on every page load, which is the flash this exists to avoid.
 *
 * The two event pages keep their own palettes whatever this says; see the
 * `.keep-light` rules in globals.css.
 */

export type Theme = "light" | "dark";

const KEY = "cesac.theme";
const QUERY = "(prefers-color-scheme: dark)";

/**
 * Runs in <head>, before anything is drawn. Kept small and dependency-free
 * because it is inlined into every page, and wrapped so a browser that
 * refuses localStorage still gets the system setting.
 */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${KEY}");if(t!=="light"&&t!=="dark"){t=window.matchMedia("${QUERY}").matches?"dark":"light"}document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){}})();`;

function stored(): Theme | null {
  try {
    const t = localStorage.getItem(KEY);
    return t === "light" || t === "dark" ? t : null;
  } catch {
    return null;
  }
}

function system(): Theme {
  return window.matchMedia(QUERY).matches ? "dark" : "light";
}

function apply(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

const listeners = new Set<() => void>();

export function subscribeTheme(cb: () => void) {
  listeners.add(cb);

  // A device switching between light and dark is followed only while the
  // visitor has not chosen for themselves.
  const media = window.matchMedia(QUERY);
  const onSystem = () => {
    if (!stored()) {
      apply(system());
      cb();
    }
  };
  // Another tab choosing a theme is followed in this one too.
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) {
      apply(stored() ?? system());
      cb();
    }
  };

  media.addEventListener("change", onSystem);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    media.removeEventListener("change", onSystem);
    window.removeEventListener("storage", onStorage);
  };
}

export function getThemeSnapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

/** The server cannot know, so the button renders neutral until it can. */
export function getThemeServerSnapshot(): Theme | null {
  return null;
}

export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Private mode. The choice still holds for this page view.
  }
  apply(theme);
  for (const l of listeners) l();
}
