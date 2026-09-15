import { SPEAKER_TEASE } from "@/lib/data/hr-final-boss";

import { StatTag } from "./chip";

/** An original padlock mark. Not a figure, not a photo, not a silhouette. */
function LockMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" fill="none">
      <rect x="14" y="28" width="36" height="28" rx="7" fill="currentColor" />
      <path
        d="M22 28V20a10 10 0 0 1 20 0v8"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle cx="32" cy="40" r="4.5" fill="var(--hb-ghost)" />
      <rect x="29.6" y="41" width="4.8" height="8" rx="2.4" fill="var(--hb-ghost)" />
    </svg>
  );
}

/**
 * The tease. A game-style "locked challenger" file: real facts, presented as
 * stats, with the name replaced by a row of bars rather than hidden by a
 * placeholder that implies one was forgotten. No portrait, no silhouette,
 * nothing figurative behind the lock, in keeping with the rest of the site.
 */
export function BossFile() {
  return (
    <div className="relative overflow-hidden rounded-[var(--r-xl)] border-2 border-hb-azure/30 bg-hb-deutzia shadow-[0_28px_70px_-36px_rgba(7,26,51,0.45)]">
      <div className="flex items-center justify-between gap-4 border-b-2 border-dashed border-hb-azure/25 px-6 py-4 sm:px-9">
        <p className="label-sm text-hb-azure-deep">{SPEAKER_TEASE.status}</p>
        <p className="label-sm text-hb-ink/50">FILE 01 / 01</p>
      </div>

      <div className="grid gap-8 px-6 py-8 sm:px-9 sm:py-10 lg:grid-cols-[15rem_1fr] lg:items-center">
        {/* the redacted portrait plate */}
        <div className="relative mx-auto grid aspect-square w-full max-w-[15rem] place-items-center overflow-hidden rounded-[var(--r-lg)] bg-hb-ink">
          <span
            aria-hidden
            className="animate-hb-sweep absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-hb-maya/60 to-transparent"
          />
          <LockMark className="relative h-16 w-16 text-hb-maya" />
          <p className="label-sm relative mt-4 text-hb-ghost/60">Profile image redacted</p>
        </div>

        <div>
          {/* the nameplate: bars standing in for letterforms, two words */}
          <p className="label-sm text-hb-ink/45">Name withheld</p>
          <div className="mt-3 flex flex-col gap-2 text-hb-ink">
            <span className="hb-redact" aria-hidden>
              <span style={{ width: "2.4rem" }} />
              <span style={{ width: "1.1rem" }} />
              <span style={{ width: "3.6rem" }} />
              <span style={{ width: "2rem" }} />
            </span>
            <span className="hb-redact" aria-hidden>
              <span style={{ width: "5.2rem" }} />
              <span style={{ width: "2.2rem" }} />
              <span style={{ width: "1.6rem" }} />
            </span>
          </div>
          <span className="sr-only">
            Speaker name withheld until the event is announced.
          </span>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {SPEAKER_TEASE.facts.map((f) => (
              <StatTag key={f.label} label={f.label} value={f.value} />
            ))}
          </div>

          <p className="hb-cursive mt-6 text-[1.15rem] leading-snug text-hb-azure-deep">
            {SPEAKER_TEASE.note}
          </p>
        </div>
      </div>
    </div>
  );
}
