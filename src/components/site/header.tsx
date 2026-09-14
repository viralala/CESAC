"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Emblem } from "@/components/aot/art";
import { CESAC } from "@/lib/data/cesac";

/**
 * The nav is the committee's, not the event's.
 *
 * It used to read Chapters / Prizes / Team, which are sections of one
 * hackathon. Anyone landing on the site now needs to find the community first
 * and the event as one of the things inside it.
 */
const NAV = [
  { href: "/about", label: "About" },
  { href: "/events", label: "Events" },
  { href: "/people", label: "People" },
];

/**
 * Flat on the cream ground at rest, the way the Reika board sits its nav
 * straight on the paper; on scroll it lifts into a floating pill bar.
 */
export function SiteHeader({ signedIn = false, consoleHref = "/dashboard" }: {
  /**
   * Read on the server in the root layout and passed down, because this bar
   * is a client component and has no session of its own. Signed in, the
   * call to action stops inviting people through a door they already walked.
   */
  signedIn?: boolean;
  consoleHref?: string;
} = {}) {
  const pathname = usePathname();
  const [lifted, setLifted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 64);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isOn = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Past the gate the console draws its own bar. Two stacked navs, one of them
  // pointing back out of the thing you just signed into, is not a header.
  if (isOn("/dashboard") || isOn("/admin")) return null;

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <div
        className={`mx-auto flex w-full max-w-[1280px] items-center gap-5 rounded-full transition-all duration-300 ${
          lifted || open
            ? "border-2 border-ink/10 bg-white/95 px-4 py-2.5 shadow-[0_18px_40px_-28px_rgba(9,60,68,0.6)] backdrop-blur-md sm:px-5"
            : "border-2 border-transparent px-2 py-2.5 sm:px-3"
        }`}
      >
        <Link
          href="/"
          className="flex items-center gap-2.5"
          onClick={() => setOpen(false)}
          aria-label={`${CESAC.abbr} home`}
        >
          <Emblem className="h-6 w-10 shrink-0 text-ink" />
          <span className="d-wide whitespace-nowrap text-[1.05rem] leading-none text-ink">
            CE<span className="text-teal">SAC</span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isOn(item.href) ? "page" : undefined}
              className={`label px-3.5 py-2 transition-colors hover:text-teal ${
                isOn(item.href) ? "text-teal" : "text-muted"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href={signedIn ? consoleHref : "/signin"}
          className="pill pill-lime ml-auto hidden px-6 py-2.5 text-[0.8rem] lg:ml-2 lg:inline-flex"
        >
          {signedIn ? "Your console" : "Sign in"}
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="ml-auto grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-ink text-ink lg:hidden"
        >
          <span className="sr-only">Menu</span>
          <span aria-hidden className="grid gap-[5px]">
            <span
              className={`block h-[2px] w-5 bg-current transition-transform ${
                open ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span className={`block h-[2px] w-5 bg-current ${open ? "opacity-0" : ""}`} />
            <span
              className={`block h-[2px] w-5 bg-current transition-transform ${
                open ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      {open ? (
        <nav className="mx-auto mt-2 grid w-full max-w-[1280px] rounded-[var(--r-lg)] border-2 border-ink/10 bg-white p-3 shadow-[0_24px_60px_-30px_rgba(9,60,68,0.6)] lg:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="d-tall rounded-[var(--r-sm)] px-4 py-3.5 text-2xl text-ink transition-colors hover:bg-cream-2 hover:text-teal"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href={signedIn ? consoleHref : "/signin"}
            onClick={() => setOpen(false)}
            className="pill pill-lime mt-2"
          >
            {signedIn ? "Your console" : "Sign in"}
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
