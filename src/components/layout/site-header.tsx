"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { LinkButton } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/about", label: "About" },
  { href: "/events", label: "Events" },
  { href: "/people", label: "People" },
  { href: "/moments", label: "Moments" },
  { href: "/announcements", label: "Announcements" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink/90 backdrop-blur">
      <div className="mx-auto flex h-18 w-full max-w-[1440px] items-center justify-between px-6 py-4 sm:px-8 lg:px-12">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-fg"
        >
          <span aria-hidden className="size-2 bg-accent" />
          CESAC
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "font-mono text-xs uppercase tracking-wider text-fg-muted transition-colors hover:text-fg",
                  active && "text-accent hover:text-accent"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:block">
          <LinkButton href="/login" variant="secondary" size="sm">
            Portal login
          </LinkButton>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="flex size-10 items-center justify-center text-fg lg:hidden"
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          {open ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
        </button>
      </div>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              id="mobile-nav"
              className="fixed inset-x-0 top-18 bottom-0 z-40 flex flex-col gap-1 overflow-y-auto bg-ink px-6 py-8 lg:hidden"
            >
              {NAV_LINKS.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "border-b border-line py-4 font-display text-2xl font-medium text-fg",
                      active && "text-accent"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <LinkButton href="/login" variant="primary" size="lg" className="mt-8">
                Portal login
              </LinkButton>
            </div>,
            document.body
          )
        : null}
    </header>
  );
}
