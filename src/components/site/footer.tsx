import Image from "next/image";
import Link from "next/link";

import { GradientStrip } from "@/components/aot/art";
import { Container } from "@/components/aot/bits";
import { SocialMark } from "@/components/site/social-mark";
import { CESAC } from "@/lib/data/cesac";

const COLUMNS: { title: string; links: [string, string][] }[] = [
  {
    title: "CESAC",
    links: [
      ["/about", "About"],
      ["/people", "People"],
      ["/standouts", "Standouts"],
      ["/faq", "FAQ"],
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

/**
 * The department's own accounts, not the committee's and not a person's.
 *
 * These are the two places the Computer Engineering department posts as itself,
 * so they are the two that belong in a footer that says the site was built by
 * the department. Anything else a student or a committee runs is a different
 * kind of link and does not go here.
 */
const DEPARTMENT_LINKS = [
  {
    id: "linkedin" as const,
    name: "LinkedIn",
    label: "Computer Engineering, VIT Pune, on LinkedIn",
    href: "https://www.linkedin.com/in/computer-engineering-department-vit-pune/",
  },
  {
    id: "instagram" as const,
    name: "Instagram",
    label: "Computer Engineering, VIT Pune, on Instagram",
    href: "https://www.instagram.com/vitpune_computer_engineering/?hl=en",
  },
];

/** Drawn rather than fetched, so the footer blocks on no CDN. */
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

          {/* The department, elsewhere.
              Its own row rather than a line tacked onto the copyright, because
              these are the department's accounts and the line below is the
              committee's: running them together would read as one speaking for
              the other. */}
          <div className="mt-14 flex flex-col gap-4 border-t border-cream/12 pt-7 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[0.95rem] leading-relaxed text-cream/70">
              <span className="text-cream">{CESAC.department}</span>, elsewhere
              <span aria-hidden className="mx-2 text-cream/30">·</span>
              <span className="label-sm text-cream/45">{CESAC.short}</span>
            </p>

            <div className="flex items-center gap-2.5">
              {DEPARTMENT_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="label flex items-center gap-2.5 rounded-full border-2 border-cream/25 px-4 py-2 text-cream/75 transition-colors hover:border-lime hover:bg-lime hover:text-ink"
                >
                  <SocialMark id={link.id} />
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
