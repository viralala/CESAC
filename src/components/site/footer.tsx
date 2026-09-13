import Image from "next/image";
import Link from "next/link";

import { Emblem, GradientStrip } from "@/components/aot/art";
import { Container } from "@/components/aot/bits";
import { EVENT } from "@/lib/data/event";
import { DEPARTMENT } from "@/lib/data/committee";

export function SiteFooter() {
  return (
    <footer className="bg-cream px-3 pb-3 sm:px-5 sm:pb-5">
      <div className="washi-dark grain grain-dark relative overflow-hidden rounded-[var(--r-xl)] text-cream">
        <Container className="relative pb-24 pt-20">
          <p className="d-tall text-[clamp(2.2rem,7.5vw,5rem)] text-cream">
            Forge the prompt.
            <br />
            Survive the token.
            <br />
            <span className="text-red">Build what comes next.</span>
          </p>
          <p className="jp mt-6 text-[clamp(0.95rem,1.6vw,1.25rem)] text-cream/45">
            {EVENT.jp} — {EVENT.tagline}
          </p>

          <div className="mt-16 grid gap-10 border-t border-cream/12 pt-10 md:grid-cols-[1.2fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <Emblem className="h-7 w-12 text-cream" />
                <span className="d-wide text-lg">
                  Attack on <span className="text-red">Token</span>
                </span>
              </div>
              <p className="serif-it mt-4 max-w-[38ch] text-[0.95rem] leading-relaxed text-cream/60">
                {EVENT.kicker} hosted by {DEPARTMENT.body} — {DEPARTMENT.expansion},{" "}
                {DEPARTMENT.institute}.
              </p>
              <p className="label mt-6 text-cream/45">{EVENT.dateVenue}</p>
            </div>

            <nav className="grid content-start gap-3">
              <p className="label text-cream/45">Navigate</p>
              {[
                ["#event", "The event"],
                ["#chapters", "Three chapters"],
                ["#awards", "Awards"],
                ["#operations", "Operations"],
              ].map(([href, label]) => (
                <a key={href} href={href} className="text-sm text-cream/70 hover:text-red-soft">
                  {label}
                </a>
              ))}
            </nav>

            <nav className="grid content-start gap-3">
              <p className="label text-cream/45">Committee</p>
              {[
                ["#committee", "Computer Engineering"],
                ["#team", "CESAC team"],
                ["#sponsor", "Sponsor the event"],
              ].map(([href, label]) => (
                <a key={href} href={href} className="text-sm text-cream/70 hover:text-red-soft">
                  {label}
                </a>
              ))}
              <Link href="/signin" className="text-sm text-cream/70 hover:text-red-soft">
                Sign in
              </Link>
            </nav>
          </div>

          <div className="mt-14 flex flex-col gap-5 border-t border-cream/12 pt-7 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-white">
                <Image
                  src="/cesac-logo.png"
                  alt=""
                  width={64}
                  height={64}
                  className="h-7 w-auto object-contain"
                />
              </span>
              <p className="label-sm text-cream/50">
                © {new Date().getFullYear()} {DEPARTMENT.body} · VIT Pune
              </p>
            </div>
            <p className="label-sm text-cream/50">
              Original anime-inspired visuals only · no copyrighted character art
            </p>
          </div>
        </Container>

        <GradientStrip className="absolute inset-x-0 bottom-0 h-16" />
      </div>
    </footer>
  );
}
