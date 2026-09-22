import Image from "next/image";
import Link from "next/link";

import { GradientStrip } from "@/components/aot/art";
import { Container } from "@/components/aot/bits";
import { CESAC } from "@/lib/data/cesac";

const COLUMNS: { title: string; links: [string, string][] }[] = [
  {
    title: "CESAC",
    links: [
      ["/about", "About"],
      ["/people", "People"],
      ["/#contact", "Get involved"],
    ],
  },
  {
    title: "Events",
    links: [
      ["/events", "All events"],
      ["/events/attack-on-token", "Attack on Token"],
      ["/events/hr-final-boss", "HR Final Boss"],
      ["/signin", "Sign in"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["/privacy", "Privacy policy"],
      ["/terms", "Terms and conditions"],
    ],
  },
];

const MAKER_LINKS = [
  {
    id: "github" as const,
    name: "GitHub",
    label: "Viral Dhoka on GitHub",
    href: "https://github.com/viralala",
  },
  {
    id: "linkedin" as const,
    name: "LinkedIn",
    label: "Viral Dhoka on LinkedIn",
    href: "https://www.linkedin.com/in/viral-dhoka-1aa3b4318/",
  },
];

/** Drawn rather than fetched, so the footer blocks on no CDN. */
function MakerMark({ id }: { id: "github" | "linkedin" }) {
  if (id === "github") {
    return (
      <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" aria-hidden fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38l-.01-1.34c-2.23.48-2.7-1.07-2.7-1.07-.36-.93-.89-1.18-.89-1.18-.73-.5.05-.49.05-.49.81.06 1.23.83 1.23.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48l-.01 2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" aria-hidden fill="currentColor">
      <path d="M13.63 13.63h-2.37V9.92c0-.89-.02-2.03-1.24-2.03-1.24 0-1.43.97-1.43 1.97v3.77H6.22V6h2.28v1.04h.03c.32-.6 1.09-1.24 2.25-1.24 2.4 0 2.85 1.58 2.85 3.64v4.19ZM3.55 4.96a1.38 1.38 0 1 1 0-2.76 1.38 1.38 0 0 1 0 2.76Zm1.19 8.67H2.36V6h2.38v7.63ZM14.82 0H1.18C.53 0 0 .52 0 1.16v13.68C0 15.48.53 16 1.18 16h13.64c.65 0 1.18-.52 1.18-1.16V1.16C16 .52 15.47 0 14.82 0Z" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-cream px-3 pb-3 sm:px-5 sm:pb-5">
      <div className="washi-deep grain grain-dark relative overflow-hidden rounded-[var(--r-xl)] text-cream">
        <Container className="relative pb-24 pt-20">
          {/* The closing statement, and the biggest type on the page after the
              hero. It is the only line in the footer anybody is meant to read
              from across the room, so it is sized to be read that way. */}
          <p className="d-tall text-[clamp(2.7rem,8.8vw,6.4rem)] leading-[0.92] text-cream">
            Built by the
            <br />
            department,
            <br />
            <span className="text-lime">for the department.</span>
          </p>
          <p className="jp mt-7 text-[clamp(1.2rem,2.5vw,2rem)] text-cream/55">
            学生委員会 · {CESAC.short}
          </p>

          <div className="mt-16 grid gap-10 border-t border-cream/12 pt-10 md:grid-cols-[1.3fr_repeat(3,1fr)]">
            <div>
              <div className="flex items-center gap-3">
                {/* The real committee mark, not the invented crest. Knocked out
                    to solid white because the footer ground is near-black and
                    the mark's own blues disappear into it. */}
                <Image
                  src="/cesac-mark.png"
                  alt=""
                  width={407}
                  height={433}
                  className="h-8 w-auto shrink-0 brightness-0 invert"
                  sizes="32px"
                />
                <span className="d-wide text-lg">
                  CE<span className="text-lime">SAC</span>
                </span>
              </div>
              <p className="mt-4 max-w-[34ch] text-[0.9rem] leading-relaxed text-cream/60">
                {CESAC.name}, {CESAC.department}, {CESAC.institute}.
              </p>
            </div>

            {COLUMNS.map((col) => (
              <nav key={col.title} className="grid content-start gap-3">
                <p className="label text-cream/45">{col.title}</p>
                {col.links.map(([href, label]) => (
                  <Link
                    key={href}
                    href={href}
                    className="text-sm text-cream/70 transition-colors hover:text-lime"
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            ))}
          </div>

          {/* Who built it.
              Its own row rather than a line tacked onto the copyright,
              because it is a different kind of statement: the line above is
              the committee's, this one is one person's, and running them
              together would read as the committee claiming the work or the
              person claiming the committee. */}
          <div className="mt-14 flex flex-col gap-4 border-t border-cream/12 pt-7 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[0.95rem] leading-relaxed text-cream/70">
              Made by <span className="text-cream">Viral Dhoka</span>
              <span aria-hidden className="mx-2 text-cream/30">·</span>
              <span className="label-sm text-cream/45">SY CS-L</span>
            </p>

            <div className="flex items-center gap-2.5">
              {MAKER_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="label flex items-center gap-2.5 rounded-full border-2 border-cream/25 px-4 py-2 text-cream/75 transition-colors hover:border-lime hover:bg-lime hover:text-ink"
                >
                  <MakerMark id={link.id} />
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-5 border-t border-cream/12 pt-7 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-white">
                <Image
                  src="/cesac-mark.png"
                  alt=""
                  width={64}
                  height={64}
                  className="h-7 w-auto object-contain"
                />
              </span>
              <p className="label-sm text-cream/50">
                © {new Date().getFullYear()} {CESAC.abbr} · {CESAC.short}
              </p>
            </div>
            <p className="label-sm text-cream/50">
              Original artwork only · no character art · no tracking
            </p>
          </div>
        </Container>

        <GradientStrip className="absolute inset-x-0 bottom-0 h-16" />
      </div>
    </footer>
  );
}
