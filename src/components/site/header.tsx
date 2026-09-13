"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Emblem } from "@/components/aot/art";

const NAV = [
  { href: "#event", label: "Event" },
  { href: "#chapters", label: "Chapters" },
  { href: "#awards", label: "Awards" },
  { href: "#committee", label: "Committee" },
  { href: "#team", label: "Team" },
];

/**
 * Flat on the cream ground at rest, the way the Reika board sits its nav
 * straight on the paper; on scroll it lifts into Yonika's floating pill bar.
 */
export function SiteHeader() {
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

  const onHome = pathname === "/";
  const hrefFor = (hash: string) => (onHome ? hash : `/${hash}`);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <div
        className={`mx-auto flex w-full max-w-[1280px] items-center gap-5 rounded-full transition-all duration-300 ${
          lifted || open
            ? "border-2 border-ink/10 bg-white/95 px-4 py-2.5 shadow-[0_18px_40px_-28px_rgba(21,20,26,0.6)] backdrop-blur-md sm:px-5"
            : "border-2 border-transparent px-2 py-2.5 sm:px-3"
        }`}
      >
        <Link
          href="/"
          className="flex items-center gap-2.5"
          onClick={() => setOpen(false)}
          aria-label="Attack on Token — home"
        >
          <Emblem className="h-6 w-10 shrink-0 text-ink" />
          <span className="d-wide whitespace-nowrap text-[1.05rem] leading-none text-ink">
            Attack on <span className="text-red">Token</span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={hrefFor(item.href)}
              className="label px-3.5 py-2 text-muted transition-colors hover:text-red"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Link
          href="/signin"
          className="pill ml-auto hidden px-6 py-2.5 text-[0.8rem] lg:ml-2 lg:inline-flex"
        >
          Sign in
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
        <nav className="mx-auto mt-2 grid w-full max-w-[1280px] rounded-[var(--r-lg)] border-2 border-ink/10 bg-white p-3 shadow-[0_24px_60px_-30px_rgba(21,20,26,0.6)] lg:hidden">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={hrefFor(item.href)}
              onClick={() => setOpen(false)}
              className="d-tall rounded-[var(--r-sm)] px-4 py-3.5 text-2xl text-ink transition-colors hover:bg-cream-2 hover:text-red"
            >
              {item.label}
            </a>
          ))}
          <Link href="/signin" onClick={() => setOpen(false)} className="pill pill-red mt-2">
            Sign in
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
