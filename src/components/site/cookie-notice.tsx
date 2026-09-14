"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import {
  OPTIONAL_TRACKERS,
  PENDING,
  getServerSnapshot,
  getSnapshot,
  setConsent,
  subscribe,
} from "@/lib/consent";

/**
 * The cookie notice.
 *
 * It tells the truth about the build it ships with. Right now that build sets
 * no cookies and loads no trackers, so the notice is a statement with one
 * dismiss button, not a fake choice between Accept and Manage Preferences that
 * both do nothing.
 *
 * The moment NEXT_PUBLIC_ANALYTICS is set, the same component becomes a real
 * gate with two equally weighted buttons, and nothing loads until one is
 * pressed. Decline is not styled as the quiet option.
 */
export function CookieNotice() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // PENDING is the server and first-paint value; an answered state hides it.
  if (state === PENDING || state !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      className="fixed inset-x-3 bottom-3 z-[60] sm:inset-x-auto sm:left-5 sm:bottom-5 sm:max-w-[26rem]"
    >
      <div className="card border-2 border-ink/10 p-6">
        <p className="label text-teal">Cookies</p>

        {OPTIONAL_TRACKERS ? (
          <>
            <p className="mt-3 text-[0.9rem] leading-relaxed text-ink/80">
              We would like to load analytics to see which pages get used. It is optional and
              nothing loads until you choose.
            </p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setConsent("granted")}
                className="pill px-6 py-2.5 text-[0.8rem]"
              >
                Allow
              </button>
              <button
                type="button"
                onClick={() => setConsent("denied")}
                className="pill pill-ghost px-6 py-2.5 text-[0.8rem]"
              >
                Decline
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="mt-3 text-[0.9rem] leading-relaxed text-ink/80">
              This site sets no tracking cookies and runs no analytics. Your answer here is kept in
              your browser so we do not ask again.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => setConsent("granted")}
                className="pill px-6 py-2.5 text-[0.8rem]"
              >
                Got it
              </button>
              <Link href="/privacy" className="text-[0.85rem] font-semibold text-teal underline">
                Privacy policy
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
