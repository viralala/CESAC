"use client";

import { useState, useTransition } from "react";

import { leaveTeam } from "@/app/actions/team";

/**
 * The join code, big enough to read aloud across a room.
 *
 * The alphabet it is drawn from has no O, 0, I or 1 in it, which is what
 * makes reading it aloud work at all.
 */
export function InviteCode({ code, isCaptain }: { code: string; isCaptain: boolean }) {
  const [copied, setCopied] = useState(false);
  const [leaving, startLeaving] = useTransition();

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard refused, which is normal without a secure context or a
      // permission. The code is on screen either way.
      setCopied(false);
    }
  }

  return (
    <div className="rounded-[var(--r-md)] border-2 border-dashed border-teal/30 bg-teal/[0.05] px-6 py-6">
      <p className="label text-teal">Join code</p>
      <p className="serif-it mt-2 text-[0.95rem] leading-relaxed text-muted">
        Send this to your partner. They make their own account, then enter it under Join with a
        code.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <span className="d-tall select-all font-mono text-[2rem] uppercase leading-none tracking-[0.3em] text-ink">
          {code}
        </span>
        <button type="button" onClick={copy} className="label rounded-full border-2 border-ink/15 px-4 py-2 text-ink transition-colors hover:border-ink/35">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {isCaptain ? (
        <button
          type="button"
          disabled={leaving}
          onClick={() => startLeaving(async () => void (await leaveTeam()))}
          className="label-sm mt-5 text-red hover:underline disabled:opacity-60"
        >
          {leaving ? "Deleting" : "Delete this team and start again"}
        </button>
      ) : null}
    </div>
  );
}
