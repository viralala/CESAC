"use client";

import { useSyncExternalStore } from "react";

import { getThemeServerSnapshot, getThemeSnapshot, setTheme, subscribeTheme } from "@/lib/theme";

/**
 * The sun and the moon.
 *
 * Shows where it would take you rather than where you are, which is what a
 * switch like this is read as: a moon on the light site means "go dark".
 * Before the browser has said which theme is showing, the server renders the
 * button empty rather than guessing and flipping a moment later.
 */
export function ThemeToggle({
  className = "",
  tone = "ink",
}: {
  className?: string;
  /** "light" on a dark bar, where the icon has to be cream. */
  tone?: "ink" | "light";
}) {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getThemeServerSnapshot);
  const next = theme === "dark" ? "light" : "dark";

  const skin =
    tone === "light"
      ? "border-cream/40 text-cream hover:bg-cream hover:text-ink"
      : "border-ink/15 text-ink hover:border-ink hover:bg-ink hover:text-cream";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={theme ? `Switch to ${next} mode` : "Switch colour theme"}
      title={theme ? `Switch to ${next} mode` : undefined}
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 transition-colors ${skin} ${className}`}
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
          <circle cx="10" cy="10" r="3.6" />
          <path d="M10 1.8v2.1M10 16.1v2.1M1.8 10h2.1M16.1 10h2.1M4.2 4.2l1.5 1.5M14.3 14.3l1.5 1.5M4.2 15.8l1.5-1.5M14.3 5.7l1.5-1.5" />
        </svg>
      ) : theme === "light" ? (
        <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round">
          <path d="M16.6 12.4A7 7 0 0 1 7.6 3.4a7 7 0 1 0 9 9Z" />
        </svg>
      ) : (
        <span className="h-[18px] w-[18px]" aria-hidden />
      )}
    </button>
  );
}
