import Link from "next/link";
import type { ReactNode } from "react";

import { signOut } from "@/app/actions/auth";
import { Emblem } from "@/components/aot/art";
import { Container, Label } from "@/components/aot/bits";
import type { Viewer } from "@/lib/auth/session";

/**
 * The signed-in chrome.
 *
 * Deliberately not the public header: past the gate the nav is the console's
 * own, and the marketing bar would just be a second row of links to somewhere
 * the visitor has already left. `SiteHeader` stands itself down on these
 * routes for the same reason.
 *
 * Dark bar for organisers, teal for participants, so which console you are
 * looking at is readable from across a room on event day.
 */
export function ConsoleBar({
  viewer,
  area,
  nav,
}: {
  viewer: Viewer;
  area: string;
  nav: readonly { href: string; label: string }[];
}) {
  const isAdmin = viewer.isAdmin;

  return (
    <header
      className={`sticky top-0 z-50 border-b-2 border-white/10 ${
        isAdmin ? "washi-deep" : "washi-teal"
      }`}
    >
      <Container className="flex flex-wrap items-center gap-x-5 gap-y-3 py-3.5">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 text-cream">
          <Emblem className="h-6 w-10" />
          <span className="d-wide whitespace-nowrap text-[1rem] leading-none">
            CE<span className="text-lime">SAC</span>
          </span>
        </Link>

        <span
          className={`label-sm rounded-full px-3 py-1.5 ${
            isAdmin ? "bg-lime text-ink" : "bg-cream/15 text-cream"
          }`}
        >
          {area}
        </span>

        <nav className="order-last flex w-full items-center gap-1 overflow-x-auto hide-scrollbar sm:order-none sm:ml-2 sm:w-auto">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="label whitespace-nowrap rounded-full px-3.5 py-2 text-cream/60 transition-colors hover:bg-cream/10 hover:text-cream"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-right sm:block">
            <span className="label block text-cream">{viewer.name}</span>
            <span className="label-sm block text-cream/50">
              {isAdmin ? "Organiser" : "Participant"}
            </span>
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="label rounded-full border-2 border-cream/40 px-4 py-2 text-cream transition-colors hover:bg-cream hover:text-ink"
            >
              Sign out
            </button>
          </form>
        </div>
      </Container>
    </header>
  );
}

/** A console card. Same radius and shadow ramp as the public site's cards. */
export function Panel({
  eyebrow,
  title,
  aside,
  children,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card p-7 sm:p-9 ${className}`}>
      <header className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <div>
          {eyebrow ? <Label tone="teal">{eyebrow}</Label> : null}
          <h2 className="d-tall mt-2.5 text-[1.75rem] text-ink">{title}</h2>
        </div>
        {aside ? <div className="label text-muted">{aside}</div> : null}
      </header>
      <div className="mt-6">{children}</div>
    </section>
  );
}

/**
 * The empty state.
 *
 * For a panel whose data does not exist yet. Says what has to happen first
 * rather than showing a placeholder number, because a console that opens on
 * invented figures teaches its users to distrust the real ones.
 */
export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="serif-it rounded-[var(--r-md)] border-2 border-dashed border-ink/15 bg-cream/60 px-6 py-7 text-[1.02rem] leading-relaxed text-muted">
      {children}
    </p>
  );
}

/** A label / value row, for the facts a console states rather than charts. */
export function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ink/10 py-3.5 last:border-0">
      <dt className="label text-muted">{k}</dt>
      <dd className="text-[1.02rem] text-ink">{v}</dd>
    </div>
  );
}

/**
 * The outcome of an action, said once, above the form that caused it.
 * Red carries the same weight here as everywhere else on the site: it is the
 * spot colour for something that needs attention, never decoration.
 */
export function Notice({ tone, children }: { tone: "error" | "ok"; children: ReactNode }) {
  const bad = tone === "error";
  return (
    <p
      role={bad ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-[var(--r-md)] border-2 px-5 py-4 text-[0.98rem] leading-relaxed text-ink ${
        bad ? "border-red/30 bg-red/[0.06]" : "border-teal/25 bg-teal/[0.06]"
      }`}
    >
      <span
        aria-hidden
        className={`mt-[0.4rem] h-2.5 w-2.5 shrink-0 rounded-full ${bad ? "bg-red" : "bg-teal"}`}
      />
      <span>{children}</span>
    </p>
  );
}

export type ChipTone = "teal" | "lime" | "muted" | "red" | "ink";

/** A state, worn as a pill. The console uses these instead of coloured text. */
export function Chip({ tone = "muted", children }: { tone?: ChipTone; children: ReactNode }) {
  const skin: Record<ChipTone, string> = {
    teal: "bg-teal text-white",
    lime: "bg-lime text-ink",
    muted: "bg-cream-2 text-muted",
    red: "bg-red/10 text-red-deep",
    ink: "bg-ink text-cream",
  };
  return (
    <span className={`label-sm whitespace-nowrap rounded-full px-3 py-1.5 ${skin[tone]}`}>
      {children}
    </span>
  );
}

/**
 * One counted thing.
 *
 * Only ever rendered from a number the build actually counted. Where there is
 * nothing to count, the panel uses Empty instead.
 */
export function Stat({ value, label, note }: { value: ReactNode; label: string; note?: string }) {
  return (
    <div className="rounded-[var(--r-md)] bg-cream-2 px-5 py-5 text-center">
      <p className="d-tall text-[2.2rem] leading-none text-ink">{value}</p>
      <p className="label mt-2.5 text-teal">{label}</p>
      {note ? <p className="mt-1.5 text-[0.85rem] leading-snug text-muted">{note}</p> : null}
    </div>
  );
}
