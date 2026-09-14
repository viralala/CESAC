"use client";

import { useActionState, useId, useState } from "react";

import { createTeam, joinTeam, type TeamState } from "@/app/actions/team";
import { Notice, Panel } from "@/components/console/shell";

type Side = "create" | "join";

/**
 * What a participant sees before they have a team.
 *
 * Two routes, because a duo has two people and only one of them makes the
 * team. The other arrives holding a code, and should not have to read past a
 * create form to find where to type it.
 */
export function TeamSetup({ registrationOpen }: { registrationOpen: boolean }) {
  const [side, setSide] = useState<Side>("create");
  const [createState, createAction, creating] = useActionState<TeamState, FormData>(createTeam, {});
  const [joinState, joinAction, joining] = useActionState<TeamState, FormData>(joinTeam, {});
  const uid = useId();

  if (!registrationOpen) {
    return (
      <Panel eyebrow="Your team" title="Registration is not open">
        <p className="serif-it rounded-[var(--r-md)] border-2 border-dashed border-ink/15 bg-cream/60 px-6 py-7 text-[1.02rem] leading-relaxed text-muted">
          Teams cannot be made yet. Registration opens with the date announcement, and this panel
          turns into the form the moment organisers open it. Your account is already made, so
          there is nothing else for you to do until then.
        </p>
      </Panel>
    );
  }

  const state = side === "create" ? createState : joinState;

  return (
    <Panel eyebrow="Your team" title="You are not in a team yet">
      <div
        role="tablist"
        aria-label="Create or join a team"
        className="grid grid-cols-2 gap-1 rounded-full bg-cream-2 p-1"
      >
        {(["create", "join"] as Side[]).map((key) => (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={side === key}
            onClick={() => setSide(key)}
            className={`label rounded-full px-4 py-3 transition-colors ${
              side === key ? "bg-teal text-white" : "text-muted hover:text-ink"
            }`}
          >
            {key === "create" ? "Make a team" : "Join with a code"}
          </button>
        ))}
      </div>

      {side === "create" ? (
        <form action={createAction} className="mt-7 grid gap-5">
          <div>
            <label htmlFor={`${uid}-name`} className="label block text-ink">
              Team name
            </label>
            <input
              id={`${uid}-name`}
              name="name"
              type="text"
              required
              minLength={2}
              maxLength={60}
              placeholder="The name that goes on the leaderboard"
              aria-invalid={createState.field === "name" || undefined}
              className={`field mt-2.5 ${createState.field === "name" ? "border-red" : ""}`}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor={`${uid}-pname`} className="label block text-ink">
                Partner name
              </label>
              <input
                id={`${uid}-pname`}
                name="partner_name"
                type="text"
                maxLength={80}
                placeholder="Optional"
                className="field mt-2.5"
              />
            </div>
            <div>
              <label htmlFor={`${uid}-pemail`} className="label block text-ink">
                Partner email
              </label>
              <input
                id={`${uid}-pemail`}
                name="partner_email"
                type="email"
                maxLength={120}
                placeholder="Optional"
                className="field mt-2.5"
              />
            </div>
          </div>

          <p className="serif-it text-[0.9rem] leading-relaxed text-muted">
            Both are notes for the organisers and can be changed later. What actually adds your
            partner is the join code you get next, which they enter on their own account.
          </p>

          {createState.error ? <Notice tone="error">{createState.error}</Notice> : null}

          <button
            type="submit"
            disabled={creating}
            className="pill pill-lime w-full disabled:cursor-progress disabled:opacity-70"
          >
            {creating ? "Making the team" : "Make the team"}
          </button>
        </form>
      ) : (
        <form action={joinAction} className="mt-7 grid gap-5">
          <div>
            <label htmlFor={`${uid}-code`} className="label block text-ink">
              Join code
            </label>
            <input
              id={`${uid}-code`}
              name="code"
              type="text"
              required
              maxLength={6}
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="6 characters"
              aria-invalid={joinState.field === "code" || undefined}
              className={`field mt-2.5 text-center font-mono text-[1.4rem] uppercase tracking-[0.35em] ${
                joinState.field === "code" ? "border-red" : ""
              }`}
            />
            <p className="serif-it mt-2 text-[0.9rem] text-muted">
              Your partner gets this when they make the team.
            </p>
          </div>

          {joinState.error ? <Notice tone="error">{joinState.error}</Notice> : null}

          <button
            type="submit"
            disabled={joining}
            className="pill w-full disabled:cursor-progress disabled:opacity-70"
          >
            {joining ? "Joining" : "Join the team"}
          </button>
        </form>
      )}

      {state.notice ? (
        <div className="mt-5">
          <Notice tone="ok">{state.notice}</Notice>
        </div>
      ) : null}
    </Panel>
  );
}
