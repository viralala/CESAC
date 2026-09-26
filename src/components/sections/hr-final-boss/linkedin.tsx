"use client";

import { useEffect } from "react";

import { Container } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import type { HrfbContent } from "@/lib/data/event-content";

const BADGE_SCRIPT = "https://platform.linkedin.com/badges/js/profile.js";

function LinkedInMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3zM9 9h3.8v1.64h.05c.53-.98 1.83-2.02 3.77-2.02 4.03 0 4.78 2.55 4.78 5.86V21h-4v-5.6c0-1.34-.02-3.06-1.94-3.06-1.94 0-2.24 1.44-2.24 2.96V21H9z" />
    </svg>
  );
}

/**
 * A slot, not a promise. linkedin.username is empty until someone sets it in
 * the data file; this renders a placeholder card until then, and LinkedIn's
 * own public profile badge once it is set. That badge is worth a second look
 * before it goes live, though: it carries a name and a photo, which is the
 * thing the boss file two sections up is deliberately withholding. Whoever
 * sets the handle should decide whether this goes up before or after the
 * reveal.
 */
export function HrfbLinkedIn({ linkedin }: { linkedin: HrfbContent["linkedin"] }) {
  const hasHandle = linkedin.username.length > 0;

  useEffect(() => {
    if (!hasHandle) return;
    const script = document.createElement("script");
    script.src = BADGE_SCRIPT;
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [hasHandle]);

  return (
    <section className="grid-box py-16 sm:py-20">
      <Container>
        <Reveal>
          <div className="flex flex-col items-start gap-6 rounded-[var(--r-xl)] border-2 border-dashed border-hb-azure/30 bg-hb-deutzia px-7 py-9 sm:px-10">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-hb-azure text-white">
                <LinkedInMark className="h-6 w-6" />
              </span>
              <div>
                <p className="hb-display text-[1.4rem] uppercase text-hb-ink">{linkedin.label}</p>
                <p className="mt-1 text-[0.9rem] text-hb-ink/60">
                  {hasHandle
                    ? "Live from LinkedIn."
                    : "Nothing to embed yet. This card lights up once a LinkedIn handle is set in the data file."}
                </p>
              </div>
            </div>

            {hasHandle ? (
              <div
                className="badge-base LI-profile-badge"
                data-locale="en_US"
                data-size="large"
                data-theme="light"
                data-type="VERTICAL"
                data-vanity={linkedin.username}
                data-version="v1"
              >
                <a
                  className="badge-base__link LI-simple-link"
                  href={`https://www.linkedin.com/in/${linkedin.username}?trk=profile-badge`}
                >
                  View LinkedIn profile
                </a>
              </div>
            ) : (
              <span className="label-sm rounded-full border-2 border-hb-azure/30 px-5 py-2.5 text-hb-azure-deep">
                Handle: TBA
              </span>
            )}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
