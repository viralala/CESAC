import type { ReactNode } from "react";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto w-full max-w-[1280px] px-5 sm:px-8 ${className}`}>{children}</div>;
}

/** The board's "LVL-20" micro label. */
export function Label({
  children,
  tone = "teal",
  className = "",
}: {
  children: ReactNode;
  tone?: "teal" | "ink" | "muted" | "lime" | "light";
  className?: string;
}) {
  const color = {
    teal: "text-teal",
    ink: "text-ink",
    muted: "text-muted",
    lime: "text-lime",
    light: "text-cream/60",
  }[tone];

  return <p className={`label ${color} ${className}`}>{children}</p>;
}

/**
 * Section header.
 *
 * Title left, aside right, both on the same baseline — so the supporting line
 * never stacks under the headline as a paragraph waiting to be read. Anything
 * that does not fit in the aside belongs in a card, not here.
 */
export function SectionHead({
  eyebrow,
  title,
  aside,
  tone = "light",
  className = "",
}: {
  eyebrow: string;
  title: ReactNode;
  aside?: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";

  return (
    <header className={`flex flex-wrap items-end justify-between gap-6 ${className}`}>
      <div>
        <Label tone={dark ? "lime" : "teal"}>{eyebrow}</Label>
        <h2
          className={`d-tall mt-4 text-[clamp(2.6rem,7vw,5.25rem)] ${
            dark ? "text-cream" : "text-ink"
          }`}
        >
          {title}
        </h2>
      </div>
      {aside ? (
        <p
          className={`serif-it max-w-[38ch] text-[1.05rem] leading-snug ${
            dark ? "text-cream/65" : "text-muted"
          }`}
        >
          {aside}
        </p>
      ) : null}
    </header>
  );
}

export function Arrow({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" fill="none">
      <path
        d="M4 12 12 4M6 4h6v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Position indicator.
 *
 * Bars rather than dots: the active one simply gets longer, which reads as
 * progress instead of as a row of lights.
 */
export function Ticks({
  count,
  active,
  tone = "light",
}: {
  count: number;
  active: number;
  tone?: "light" | "dark";
}) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={`block h-[3px] rounded-full transition-all duration-300 ${
            i === active
              ? `w-7 ${tone === "dark" ? "bg-cream" : "bg-teal"}`
              : `w-3 ${tone === "dark" ? "bg-cream/25" : "bg-ink/15"}`
          }`}
        />
      ))}
    </div>
  );
}
