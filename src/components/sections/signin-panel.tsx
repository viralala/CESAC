"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";

import {
  signInWithPassword,
  signUpWithPassword,
  signInWithProvider,
  type AuthState,
} from "@/app/actions/auth";
import { Emblem, WallMark } from "@/components/aot/art";
import { Container, Label, Ticks } from "@/components/aot/bits";
import { Notice } from "@/components/console/shell";
import { EVENT } from "@/lib/data/event";

type Mode = "signin" | "signup";

const COPY: Record<Mode, { tab: string; title: string; lede: string; submit: string; pending: string }> =
  {
    signin: {
      tab: "Sign in",
      title: "Cadet sign in",
      lede: "Your console holds your team, your hand-ins and your standing. Organisers land in theirs from the same door.",
      submit: "Enter the gate",
      pending: "Opening the gate",
    },
    signup: {
      tab: "Create account",
      title: "Make an account",
      lede: "One account each. You make a team after you are in, and your partner joins it with a code.",
      submit: "Create the account",
      pending: "Creating",
    },
  };

const PROVIDERS = [
  { id: "google", label: "Google" },
  { id: "github", label: "GitHub" },
  { id: "facebook", label: "Facebook" },
] as const;

/**
 * Crypko's shell again: one rounded frame holding a deep panel and a white
 * form, with Yonika's pill fields and buttons.
 *
 * The two tabs used to be participant and organiser, which no longer means
 * anything: everyone signs in the same way and the role on the account
 * decides which console opens. So the tabs now carry the choice that is
 * actually in front of a visitor, which is whether they have an account yet.
 */
export function SignInPanel({
  initialMode,
  next,
  urlError,
  notice,
}: {
  initialMode: Mode;
  next?: string;
  urlError?: string;
  notice?: string;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [signInState, signInAction, signingIn] = useActionState<AuthState, FormData>(
    signInWithPassword,
    {},
  );
  const [signUpState, signUpAction, signingUp] = useActionState<AuthState, FormData>(
    signUpWithPassword,
    {},
  );

  const uid = useId();
  const copy = COPY[mode];
  const isSignUp = mode === "signup";

  const state = isSignUp ? signUpState : signInState;
  const pending = isSignUp ? signingUp : signingIn;
  const error = state.error ?? (mode === "signin" ? urlError : undefined);
  const said = state.notice ?? (mode === "signin" ? notice : undefined);

  return (
    <div className="washi grain min-h-[100svh] py-24 sm:py-28">
      <Container>
        <div className="shell">
          <div className="shell-inner grid lg:grid-cols-[1fr_1fr]">
            {/* the wall side */}
            <aside
              style={{ ["--panel" as string]: isSignUp ? "var(--teal-2)" : "var(--teal)" }}
              className={`relative isolate hidden overflow-hidden p-10 text-cream lg:flex lg:flex-col xl:p-12 ${
                isSignUp ? "washi-deep" : "washi-teal"
              } transition-colors duration-500`}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-[18%] -z-10 aspect-square w-[62%] -translate-x-1/2 rounded-full bg-lime opacity-90"
              />
              <WallMark className="pointer-events-none absolute bottom-0 left-1/2 -z-10 h-[64%] w-auto -translate-x-1/2 text-ink" />
              {/* scrim so the creed stays readable where it crosses the wall */}
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
                  Attack on <span className="text-lime">Token</span>
                </span>
              </Link>

              <div className="relative mt-auto">
                <Label tone="light">{EVENT.host}</Label>
                <p className="d-tall mt-4 text-[clamp(2rem,3.2vw,3rem)]">
                  Forge the prompt.
                  <br />
                  Survive the token.
                  <br />
                  <span className="text-lime">Build what comes next.</span>
                </p>
                <div className="mt-7 flex items-center gap-5">
                  <Ticks count={3} active={isSignUp ? 2 : 0} tone="dark" />
                  <span className="label-sm text-cream/50">{EVENT.dateVenue}</span>
                </div>
              </div>
            </aside>

            {/* the form side */}
            <div className="flex items-center justify-center bg-white px-6 py-14 sm:px-12">
              <div className="w-full max-w-[420px]">
                <Label tone={isSignUp ? "muted" : "teal"}>Access</Label>
                <h1 className="d-tall mt-3 text-[2.5rem] text-ink">{copy.title}</h1>
                <p className="serif-it mt-3 text-[1.05rem] leading-relaxed text-muted">
                  {copy.lede}
                </p>

                {/* mode toggle, as a segmented pill */}
                <div
                  role="tablist"
                  aria-label="Sign in or create an account"
                  className="mt-8 grid grid-cols-2 gap-1 rounded-full bg-cream-2 p-1"
                >
                  {(Object.keys(COPY) as Mode[]).map((key) => {
                    const active = key === mode;
                    return (
                      <button
                        key={key}
                        role="tab"
                        type="button"
                        aria-selected={active}
                        onClick={() => setMode(key)}
                        className={`label rounded-full px-4 py-3 transition-colors ${
                          active
                            ? key === "signup"
                              ? "bg-ink text-cream"
                              : "bg-teal text-white"
                            : "text-muted hover:text-ink"
                        }`}
                      >
                        {COPY[key].tab}
                      </button>
                    );
                  })}
                </div>

                {/* the social routes first: fewer steps, and no password to lose */}
                <div className="mt-7 grid gap-2.5">
                  {PROVIDERS.map((provider) => (
                    <form key={provider.id} action={signInWithProvider}>
                      <input type="hidden" name="provider" value={provider.id} />
                      {next ? <input type="hidden" name="next" value={next} /> : null}
                      <button
                        type="submit"
                        className="flex w-full items-center justify-center gap-3 rounded-full border-2 border-ink/15 bg-white px-5 py-3.5 text-[0.95rem] text-ink transition-colors hover:border-ink/35 hover:bg-cream-2"
                      >
                        <ProviderMark id={provider.id} />
                        <span className="label">Continue with {provider.label}</span>
                      </button>
                    </form>
                  ))}
                </div>

                <div className="my-7 flex items-center gap-4">
                  <span aria-hidden className="h-px flex-1 bg-ink/10" />
                  <span className="label-sm text-muted">or with an email</span>
                  <span aria-hidden className="h-px flex-1 bg-ink/10" />
                </div>

                <form
                  key={mode}
                  action={isSignUp ? signUpAction : signInAction}
                  className="grid gap-5"
                >
                  {next ? <input type="hidden" name="next" value={next} /> : null}

                  {isSignUp ? (
                    <div>
                      <label htmlFor={`${uid}-name`} className="label block text-ink">
                        Your name
                      </label>
                      <input
                        id={`${uid}-name`}
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        aria-invalid={state.field === "name" || undefined}
                        placeholder="As it should appear on the certificate"
                        className={`field mt-2.5 ${state.field === "name" ? "border-red" : ""}`}
                      />
                    </div>
                  ) : null}

                  <div>
                    <label htmlFor={`${uid}-email`} className="label block text-ink">
                      Email
                    </label>
                    <input
                      id={`${uid}-email`}
                      // Remounting on a new default is what makes the value
                      // survive React's post-action form reset.
                      key={`${mode}-email-${state.email ?? ""}`}
                      name="email"
                      type="email"
                      defaultValue={state.email}
                      autoComplete="email"
                      required
                      aria-invalid={state.field === "email" || undefined}
                      placeholder="you@vit.edu"
                      className={`field mt-2.5 ${state.field === "email" ? "border-red" : ""}`}
                    />
                  </div>

                  <div>
                    <label htmlFor={`${uid}-pw`} className="label block text-ink">
                      Password
                    </label>
                    <input
                      id={`${uid}-pw`}
                      name="password"
                      type="password"
                      autoComplete={isSignUp ? "new-password" : "current-password"}
                      required
                      minLength={isSignUp ? 8 : undefined}
                      aria-invalid={state.field === "password" || undefined}
                      placeholder="••••••••"
                      className={`field mt-2.5 ${state.field === "password" ? "border-red" : ""}`}
                    />
                    {isSignUp ? (
                      <p className="serif-it mt-2 text-[0.85rem] text-muted">
                        At least 8 characters.
                      </p>
                    ) : null}
                  </div>

                  {!isSignUp ? (
                    <div className="flex justify-end">
                      <Link href="/signin/help" className="label text-teal hover:underline">
                        Forgot password
                      </Link>
                    </div>
                  ) : null}

                  {error ? <Notice tone="error">{error}</Notice> : null}
                  {said ? <Notice tone="ok">{said}</Notice> : null}

                  <button
                    type="submit"
                    disabled={pending}
                    className={`pill mt-1 w-full disabled:cursor-progress disabled:opacity-70 ${
                      isSignUp ? "" : "pill-lime"
                    }`}
                  >
                    {pending ? copy.pending : copy.submit}
                  </button>
                </form>

                <p className="serif-it mt-8 border-t border-ink/10 pt-6 text-[0.95rem] leading-relaxed text-muted">
                  {isSignUp
                    ? "Making an account does not enter you. You build your team and pay the entry fee from the console once you are in."
                    : "Not registered yet? Make an account, then build your team from the console."}
                </p>

                <p className="label mt-6 text-muted">
                  <Link href="/" className="hover:text-teal">
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

/** Provider marks, drawn rather than fetched so nothing blocks on a CDN. */
function ProviderMark({ id }: { id: (typeof PROVIDERS)[number]["id"] }) {
  if (id === "google") {
    return (
      <svg viewBox="0 0 18 18" className="h-[1.15rem] w-[1.15rem]" aria-hidden>
        <path
          fill="#4285F4"
          d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
        />
        <path
          fill="#FBBC05"
          d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
        />
        <path
          fill="#EA4335"
          d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
        />
      </svg>
    );
  }

  if (id === "github") {
    return (
      <svg viewBox="0 0 16 16" className="h-[1.15rem] w-[1.15rem]" aria-hidden fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38l-.01-1.34c-2.23.48-2.7-1.07-2.7-1.07-.36-.93-.89-1.18-.89-1.18-.73-.5.05-.49.05-.49.81.06 1.23.83 1.23.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48l-.01 2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" className="h-[1.15rem] w-[1.15rem]" aria-hidden>
      <path
        fill="#1877F2"
        d="M16 8a8 8 0 1 0-9.25 7.9v-5.59H4.72V8h2.03V6.24c0-2 1.19-3.11 3.02-3.11.87 0 1.79.16 1.79.16v1.97h-1.01c-.99 0-1.3.62-1.3 1.25V8h2.22l-.36 2.31H9.25v5.59A8 8 0 0 0 16 8Z"
      />
    </svg>
  );
}
