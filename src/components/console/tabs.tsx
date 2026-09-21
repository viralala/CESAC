"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type Tab = { href: string; label: string; badge?: number };

/**
 * The console's own spine.
 *
 * Six places, one row, and the one you are standing in is filled rather than
 * underlined, because on a phone this strip scrolls sideways and an underline
 * half off the edge tells you nothing. The badge is only ever a real count:
 * where there is nothing to count it does not render, rather than showing a
 * nought that reads as a notification.
 */
export function ConsoleTabs({ tabs }: { tabs: readonly Tab[] }) {
  const pathname = usePathname();

  /*
   * The longest matching href wins, and only one tab lights.
   *
   * This used to special-case /dashboard, because /dashboard is a prefix of
   * every other tab in that row and would otherwise have been lit on all of
   * them. The same trap is in every nested strip: /admin/site is a prefix of
   * /admin/site/roster. Picking the longest match handles both without a rule
   * about any particular path, and a nested page with no tab of its own still
   * lights its parent.
   */
  const current = [...tabs]
    .sort((a, b) => b.href.length - a.href.length)
    .find((tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`))?.href;

  return (
    <nav
      aria-label="Your console"
      className="hide-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-1"
    >
      {tabs.map((tab) => {
        const active = tab.href === current;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`label flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 transition-colors ${
              active
                ? "bg-ink text-cream"
                : "bg-white text-muted hover:bg-cream-2 hover:text-ink"
            }`}
          >
            {tab.label}
            {tab.badge ? (
              <span
                className={`label-sm rounded-full px-2 py-0.5 ${
                  active ? "bg-cream/20 text-cream" : "bg-teal text-white"
                }`}
              >
                {tab.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
