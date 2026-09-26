"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type Item = { href: string; label: string };

/**
 * The console bar's links.
 *
 * This used to be one row that scrolled sideways with its scrollbar hidden,
 * so on any screen narrower than all thirteen organiser links the last few
 * (Access, Controls, Roster) were simply not there as far as anybody could
 * tell. Now every link is always on screen: on a wide screen the row wraps
 * onto a second line, and on a phone the links fold behind a Menu button
 * rather than stacking five rows deep inside a sticky header.
 *
 * A client component because the bar lives in a layout, which does not
 * re-render on navigation: the lit link and the menu closing after a tap both
 * need the current path.
 */
export function ConsoleNav({ items }: { items: readonly Item[] }) {
  const pathname = usePathname();
  // Open on one path only. A tap on a link navigates, and the menu should
  // not still be open over the page it opened, so it is remembered by where
  // it was opened rather than as a plain flag.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  // Longest match lights, so /admin does not stay lit under /admin/site.
  const current = [...items]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))?.href;

  const links = items.map((item) => {
    const active = item.href === current;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`label whitespace-nowrap rounded-full px-3.5 py-2 transition-colors ${
          active ? "bg-cream text-ink" : "text-cream/70 hover:bg-cream/10 hover:text-cream"
        }`}
      >
        {item.label}
      </Link>
    );
  });

  return (
    <>
      {/* phones and small tablets: one button, the links fold under it */}
      <button
        type="button"
        aria-expanded={open}
        aria-controls="console-nav-menu"
        onClick={() => setOpenOn(open ? null : pathname)}
        className="label rounded-full border-2 border-cream/40 px-4 py-2 text-cream transition-colors hover:bg-cream/10 lg:hidden"
      >
        {open ? "Close" : "Menu"}
      </button>

      <nav
        id="console-nav-menu"
        aria-label="Console"
        className={`order-last w-full flex-wrap items-center gap-1 ${open ? "flex" : "hidden"} lg:flex`}
      >
        {links}
      </nav>
    </>
  );
}
