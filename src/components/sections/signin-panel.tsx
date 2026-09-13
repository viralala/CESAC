"use client";

import Link from "next/link";
import { useId, useState, type FormEvent } from "react";

import { Emblem, TitanFigure } from "@/components/aot/art";
import { Container, Dots, Label } from "@/components/aot/bits";
import { EVENT } from "@/lib/data/event";

type Role = "participant" | "admin";

const ROLES: Record<
  Role,
  {
    tab: string;
    title: string;
    lede: string;
    idLabel: string;
    idPlaceholder: string;
    idType: string;
    idHint: string;
    submit: string;
    aside: string;
  }
> = {
  participant: {
    tab: "Participant",
    title: "Cadet sign in",
    lede: "For registered two-person teams. Sign in to see your chapter status, submissions and leaderboard position.",
    idLabel: "Team email",
    idPlaceholder: "you@vit.edu",
    idType: "email",
    idHint: "Use the email your team registered with.",
    submit: "Enter the gate",
    aside:
      "Not registered yet? Entry is ₹200 per team of two. Registration opens with the date announcement.",
  },
  admin: {
    tab: "Admin",
    title: "Organiser sign in",
    lede: "Restricted to CESAC committee accounts. Grading pipeline, leaderboard control and chapter cuts.",
    idLabel: "Organiser ID",
    idPlaceholder: "cesac.organiser",
    idType: "text",
    idHint: "Issued by the Technical vertical. Not the same as your team login.",
    submit: "Open command",
    aside: "Lost access? Ask the Technical vertical to reissue your organiser credentials.",
  },
};

/**
 * Crypko's shell again: one rounded frame holding a deep panel and a white
 * form, with Yonika's pill fields and buttons.
 */
export function SignInPanel({ initialRole }: { initialRole: Role }) {
  const [role, setRole] = useState<Role>(initialRole);
  const [notice, setNotice] = useState(false);
  const uid = useId();
  const copy = ROLES[role];
  const isAdmin = role === "admin";

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(true);
  }

  return (
    <div className="washi grain min-h-[100svh] py-24 sm:py-28">
      <Container>
        <div className="shell">
          <div className="shell-inner grid lg:grid-cols-[1fr_1fr]">
            {/* the wall side */}
            <aside
              style={{ ["--panel" as string]: isAdmin ? "var(--ink)" : "var(--teal)" }}
              className={`relative isolate hidden overflow-hidden p-10 text-cream lg:flex lg:flex-col xl:p-12 ${
                isAdmin ? "washi-dark" : "washi-teal"
              } transition-colors duration-500`}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-[18%] -z-10 aspect-square w-[62%] -translate-x-1/2 rounded-full bg-red opacity-90"
              />
              <TitanFigure className="pointer-events-none absolute bottom-0 left-1/2 -z-10 h-[64%] w-auto -translate-x-1/2 text-ink" />
              {/* scrim so the creed stays readable where it crosses the figure */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-1/2"
                style={{
                  background: "linear-gradient(to top, var(--panel) 30%, transparent 100%)",
                }}
              />
              <span
                aria-hidden
                className="jp pointer-events-none absolute right-4 top-[10%] -z-10 select-none text-[4rem] leading-[1.05] text-cream/[0.08] [writing-mode:vertical-rl]"
              >
                {EVENT.jp}
              </span>

              <Link href="/" className="relative flex items-center gap-3">
                <Emblem className="h-7 w-12 text-cream" />
                <span className="d-wide text-lg">
                  Attack on <span className="text-red">Token</span>
                </span>
              </Link>

              <div className="relative mt-auto">
                <Label tone="light">{EVENT.host}</Label>
                <p className="d-tall mt-4 text-[clamp(2rem,3.2vw,3rem)]">
                  Forge the prompt.
                  <br />
                  Survive the token.
                  <br />
                  <span className="text-red">Build what comes next.</span>
                </p>
                <div className="mt-7 flex items-center gap-5">
                  <Dots count={3} active={isAdmin ? 2 : 0} tone="dark" />
                  <span className="label-sm text-cream/50">{EVENT.dateVenue}</span>
                </div>
              </div>
            </aside>

            {/* the form side */}
            <div className="flex items-center justify-center bg-white px-6 py-14 sm:px-12">
              <div className="w-full max-w-[420px]">
                <Label tone={isAdmin ? "muted" : "red"}>Access</Label>
                <h1 className="d-tall mt-3 text-[2.5rem] text-ink">{copy.title}</h1>
                <p className="serif-it mt-3 text-[1.05rem] leading-relaxed text-muted">
                  {copy.lede}
                </p>

                {/* role toggle, as a segmented pill */}
                <div
                  role="tablist"
                  aria-label="Sign in as"
                  className="mt-8 grid grid-cols-2 gap-1 rounded-full bg-cream-2 p-1"
                >
                  {(Object.keys(ROLES) as Role[]).map((key) => {
                    const active = key === role;
                    return (
                      <button
                        key={key}
                        role="tab"
                        type="button"
                        aria-selected={active}
                        onClick={() => {
                          setRole(key);
                          setNotice(false);
                        }}
                        className={`label rounded-full px-4 py-3 transition-colors ${
                          active
                            ? key === "admin"
                              ? "bg-ink text-cream"
                              : "bg-red text-white"
                            : "text-muted hover:text-ink"
                        }`}
                      >
                        {ROLES[key].tab}
                      </button>
                    );
                  })}
                </div>

                <form onSubmit={onSubmit} className="mt-8 grid gap-5">
                  <div>
                    <label htmlFor={`${uid}-id`} className="label block text-ink">
                      {copy.idLabel}
                    </label>
                    <input
                      id={`${uid}-id`}
                      key={`${role}-id`}
                      name="identifier"
                      type={copy.idType}
                      autoComplete={isAdmin ? "username" : "email"}
                      required
                      placeholder={copy.idPlaceholder}
                      className="field mt-2.5"
                    />
                    <p className="serif-it mt-2 text-[0.85rem] text-muted">{copy.idHint}</p>
                  </div>

                  <div>
                    <label htmlFor={`${uid}-pw`} className="label block text-ink">
                      Password
                    </label>
                    <input
                      id={`${uid}-pw`}
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      placeholder="••••••••"
                      className="field mt-2.5"
                    />
                  </div>

                  {isAdmin ? (
                    <div>
                      <label htmlFor={`${uid}-code`} className="label block text-ink">
                        Access code
                      </label>
                      <input
                        id={`${uid}-code`}
                        name="code"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="6-digit code"
                        className="field mt-2.5"
                      />
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-2.5 text-sm text-muted">
                      <input
                        type="checkbox"
                        name="remember"
                        className="h-4 w-4 rounded accent-[var(--red)]"
                      />
                      Keep me signed in
                    </label>
                    <button type="button" className="label text-red hover:underline">
                      Forgot password
                    </button>
                  </div>

                  <button
                    type="submit"
                    className={`pill mt-1 w-full ${isAdmin ? "" : "pill-red"}`}
                  >
                    {copy.submit}
                  </button>

                  {notice ? (
                    <p
                      role="status"
                      className="serif-it rounded-[var(--r-md)] bg-cream-2 px-5 py-4 text-[0.95rem] leading-relaxed text-ink/75"
                    >
                      Sign-in isn&apos;t wired up yet — this is the front door only. Accounts go live
                      with registration.
                    </p>
                  ) : null}
                </form>

                <p className="serif-it mt-8 border-t border-ink/10 pt-6 text-[0.95rem] leading-relaxed text-muted">
                  {copy.aside}
                </p>

                <p className="label mt-6 text-muted">
                  <Link href="/" className="hover:text-red">
                    ← Back to the event
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
