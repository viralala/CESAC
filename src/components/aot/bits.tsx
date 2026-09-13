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

/** Reika's "LVL-20" micro label. */
export function Label({
  children,
  tone = "red",
  className = "",
}: {
  children: ReactNode;
  tone?: "red" | "ink" | "muted" | "light";
  className?: string;
}) {
  const color =
    tone === "ink"
      ? "text-ink"
      : tone === "muted"
        ? "text-muted"
        : tone === "light"
          ? "text-cream/60"
          : "text-red";
  return <p className={`label ${color} ${className}`}>{children}</p>;
}

/**
 * Section header. The eyebrow is a micro label, the title is Anton at scale,
 * and the lede drops into Yonika's serif italic so every section opens with
 * two contrasting type voices rather than one.
 */
export function SectionHead({
  eyebrow,
  title,
  lede,
  tone = "light",
  align = "left",
  className = "",
}: {
  eyebrow: string;
  title: ReactNode;
  lede?: string;
  tone?: "light" | "dark";
  align?: "left" | "center";
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <header className={`${align === "center" ? "text-center" : ""} ${className}`}>
      <Label tone={dark ? "light" : "red"}>{eyebrow}</Label>
      <h2
        className={`d-tall mt-4 text-[clamp(2.6rem,7vw,5.25rem)] ${
          dark ? "text-cream" : "text-ink"
        }`}
      >
        {title}
      </h2>
      {lede ? (
        <p
          className={`serif-it mt-5 max-w-[54ch] text-[clamp(1.05rem,1.8vw,1.35rem)] leading-[1.5] ${
            align === "center" ? "mx-auto" : ""
          } ${dark ? "text-cream/70" : "text-muted"}`}
        >
          {lede}
        </p>
      ) : null}
    </header>
  );
}

/** Numbered marker — a filled circle rather than the deck's square. */
export function NumDot({ n, tone = "light" }: { n: string; tone?: "light" | "dark" }) {
  return (
    <span
      className={`label-sm grid h-9 w-9 shrink-0 place-items-center rounded-full ${
        tone === "dark" ? "bg-cream text-ink" : "bg-ink text-cream"
      }`}
    >
      {n}
    </span>
  );
}

/** Soft chip used for sponsor slots and alternates. */
export function Chip({
  children,
  tone = "light",
}: {
  children: ReactNode;
  tone?: "light" | "dark" | "red";
}) {
  const styles =
    tone === "dark"
      ? "border-line-dark text-cream"
      : tone === "red"
        ? "border-red bg-red text-white"
        : "border-ink/15 bg-white text-ink";
  return (
    <span className={`label-sm inline-block rounded-full border-2 px-4 py-2.5 ${styles}`}>
      {children}
    </span>
  );
}

/** Reika's small white info card with its red circular arrow. */
export function InfoCard({
  title,
  body,
  href,
  className = "",
}: {
  title: string;
  body: string;
  href?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-start gap-4 rounded-[var(--r-md)] bg-white p-5 shadow-[0_18px_40px_-24px_rgba(21,20,26,0.55)] ${className}`}
    >
      <div className="min-w-0">
        <p className="text-[1.05rem] font-extrabold leading-tight text-red">{title}</p>
        <p className="serif-it mt-1.5 text-[0.9rem] leading-snug text-ink/70">{body}</p>
      </div>
      {href ? (
        <a href={href} className="dot-btn shrink-0" aria-label={title}>
          <Arrow />
        </a>
      ) : null}
    </div>
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

/** Samurai's carousel dots. */
export function Dots({
  count,
  active,
  tone = "light",
}: {
  count: number;
  active: number;
  tone?: "light" | "dark";
}) {
  return (
    <div className="flex items-center gap-2.5" aria-hidden>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={`block h-2.5 w-2.5 rounded-full transition-colors ${
            i === active ? "bg-red" : tone === "dark" ? "bg-cream/30" : "bg-ink/20"
          }`}
        />
      ))}
    </div>
  );
}
