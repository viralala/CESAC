import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { signOut } from "@/app/actions/auth";
import { Container, Label } from "@/components/aot/bits";
import { ConsoleNav } from "@/components/console/console-nav";
import { Avatar } from "@/components/site/avatar";
import { ThemeToggle } from "@/components/site/theme-toggle";
import type { Viewer } from "@/lib/auth/session";
import { avatarUrl } from "@/lib/photos";

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
  /** A node, not a string: the organiser console passes a client component
   *  that reads the path, because the bar lives in a layout now and a layout
   *  does not re-render on navigation. */
  area: ReactNode;
  nav: readonly { href: string; label: string }[];
}) {
  const isAdmin = viewer.isAdmin;
  // Three roles, three bars. Dark for organisers, teal for participants, and
  // the verifier gets the dark one too because what they are doing is the
  // committee's work rather than their own.
  const dark = isAdmin || viewer.isVerifier;
  const role =
    viewer.role === "owner"
      ? "Owner"
      : isAdmin
        ? "Organiser"
        : viewer.isVerifier
          ? "Verifier"
          : "Participant";

  return (
    <header
      className={`sticky top-0 z-50 border-b-2 border-white/10 ${
        dark ? "washi-deep" : "washi-teal"
      }`}
    >
      <Container className="flex flex-wrap items-center gap-x-5 gap-y-3 py-3.5">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 text-cream">
          <Image
            src="/cesac-mark.png"
            alt=""
            width={407}
            height={433}
            className="h-6 w-auto shrink-0 brightness-0 invert"
            sizes="24px"
          />
          <span className="d-wide whitespace-nowrap text-[1rem] leading-none">
            CE<span className="text-lime">SAC</span>
          </span>
        </Link>

        <span
          className={`label-sm rounded-full px-3 py-1.5 ${
            dark ? "bg-lime text-ink" : "bg-cream/15 text-cream"
          }`}
        >
          {area}
        </span>

        <ConsoleNav items={nav.map(({ href, label }) => ({ href, label }))} />

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-right sm:block">
            <span className="label block text-cream">{viewer.name}</span>
            <span className="label-sm block text-cream/50">{role}</span>
          </span>
          {/* The photo the boards print, and the way to change it. */}
          <Link
            href="/account/photo"
            title="Change your photo"
            aria-label="Change your photo"
            className="rounded-full ring-2 ring-cream/30 transition hover:ring-lime"
          >
            <Avatar
              key={viewer.photoPath ?? "none"}
              name={viewer.name}
              sources={[avatarUrl(viewer.photoPath)]}
              size={36}
            />
          </Link>
          <ThemeToggle tone="light" />
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
    lime: "bg-lime text-[var(--on-pop)]",
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
      {note ? (
        <p className="mt-1.5 text-center text-[0.85rem] leading-snug text-muted">{note}</p>
      ) : null}
    </div>
  );
}

export type TileTone = "teal" | "lime" | "violet" | "azure" | "pink" | "ink";

const TILE_SKIN: Record<TileTone, { edge: string; wash: string; dot: string }> = {
  teal: { edge: "hover:border-teal", wash: "group-hover:bg-teal/5", dot: "bg-teal" },
  lime: { edge: "hover:border-lime", wash: "group-hover:bg-lime/15", dot: "bg-lime" },
  violet: { edge: "hover:border-violet", wash: "group-hover:bg-violet/5", dot: "bg-violet" },
  azure: { edge: "hover:border-azure", wash: "group-hover:bg-azure/5", dot: "bg-azure" },
  pink: { edge: "hover:border-pink", wash: "group-hover:bg-pink/5", dot: "bg-pink" },
  ink: { edge: "hover:border-ink", wash: "group-hover:bg-ink/5", dot: "bg-ink" },
};

/**
 * One place to go, as a card the whole of which is the link.
 *
 * The command page used to be a wall of panels with the controls in them, and
 * finding the students list meant reading past the chapter cuts. It is a
 * board of these now: a card says where it goes, what is behind it and how
 * many of that thing there are, so the number is the reason to click rather
 * than something you find out afterwards.
 *
 * The whole card is one anchor rather than a div with a link in the corner,
 * because a target the size of a card can be hit on a phone at a registration
 * desk and a four-word link cannot.
 */
export function Tile({
  href,
  eyebrow,
  title,
  blurb,
  value,
  note,
  tone = "teal",
}: {
  href: string;
  eyebrow?: string;
  title: string;
  blurb: string;
  /** The live count behind the card. Left out when there is nothing to count. */
  value?: ReactNode;
  note?: string;
  tone?: TileTone;
}) {
  const skin = TILE_SKIN[tone];

  return (
    <Link
      href={href}
      className={`group relative flex flex-col overflow-hidden rounded-[var(--r-lg)] border-2 border-ink/12 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_40px_-18px_rgba(0,0,0,0.45)] ${skin.edge}`}
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-0 transition-colors duration-200 ${skin.wash}`}
      />

      <span className="relative flex items-start justify-between gap-4">
        <span className="min-w-0">
          {eyebrow ? (
            <span className="label-sm flex items-center gap-2 text-muted">
              <span aria-hidden className={`h-2 w-2 rounded-full ${skin.dot}`} />
              {eyebrow}
            </span>
          ) : null}
          <span className="d-tall mt-2 block text-[1.5rem] leading-tight text-ink">{title}</span>
        </span>
        {value !== undefined ? (
          <span className="shrink-0 text-right">
            <span className="d-tall block text-[2rem] leading-none text-ink">{value}</span>
            {note ? <span className="label-sm mt-1 block text-muted">{note}</span> : null}
          </span>
        ) : null}
      </span>

      <span className="serif-it relative mt-3 block text-[0.95rem] leading-relaxed text-muted">
        {blurb}
      </span>

      <span className="label relative mt-5 flex items-center gap-2 text-teal">
        Open
        <span
          aria-hidden
          className="transition-transform duration-200 group-hover:translate-x-1"
        >
          &rarr;
        </span>
      </span>
    </Link>
  );
}
