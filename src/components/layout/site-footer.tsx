import Link from "next/link";

import { Container } from "@/components/ui/container";

const EXPLORE_LINKS = [
  { href: "/about", label: "About" },
  { href: "/events", label: "Events" },
  { href: "/people", label: "People" },
  { href: "/moments", label: "Moments" },
];

const MORE_LINKS = [
  { href: "/announcements", label: "Announcements" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Portal login" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms & conditions" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-ink">
      <Container className="grid gap-12 py-16 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Link href="/" className="flex items-center gap-2 font-display text-xl font-semibold text-fg">
            <span aria-hidden className="size-2 bg-accent" />
            CESAC
          </Link>
          <p className="max-w-xs text-sm leading-relaxed text-fg-muted">
            The community and events hub for CESAC: programs, activities and the people who run
            them, in one place.
          </p>
        </div>

        <nav aria-label="Explore" className="flex flex-col gap-3">
          <p className="font-mono text-xs uppercase tracking-wider text-fg-muted/60">Explore</p>
          {EXPLORE_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-fg-muted hover:text-fg">
              {link.label}
            </Link>
          ))}
        </nav>

        <nav aria-label="More" className="flex flex-col gap-3">
          <p className="font-mono text-xs uppercase tracking-wider text-fg-muted/60">More</p>
          {MORE_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-fg-muted hover:text-fg">
              {link.label}
            </Link>
          ))}
        </nav>

        <nav aria-label="Legal" className="flex flex-col gap-3">
          <p className="font-mono text-xs uppercase tracking-wider text-fg-muted/60">Legal</p>
          {LEGAL_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-fg-muted hover:text-fg">
              {link.label}
            </Link>
          ))}
        </nav>
      </Container>

      <Container className="flex flex-col gap-2 border-t border-line py-6 text-xs text-fg-muted/60 sm:flex-row sm:items-center sm:justify-between">
        <p>© {year} CESAC. All rights reserved.</p>
        <p>Built for the CESAC community.</p>
      </Container>
    </footer>
  );
}
