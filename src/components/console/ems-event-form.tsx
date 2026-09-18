"use client";

import { useActionState, useState } from "react";

import { Notice } from "@/components/console/shell";
import type { EmsAdminState } from "@/app/actions/ems-admin";
import type { EventStatus } from "@/lib/supabase/ems.types";
import { toISTInput } from "@/lib/ems/time";

type Action = (state: EmsAdminState, formData: FormData) => Promise<EmsAdminState>;

export type EventDefaults = {
  id?: string;
  name?: string;
  description?: string | null;
  min_team_size?: number;
  max_team_size?: number;
  max_teams?: number;
  price_inr?: number;
  registration_start?: string;
  registration_end?: string;
  event_start?: string;
  event_end?: string;
  status?: EventStatus;
};

const STATUSES: readonly { value: EventStatus; label: string }[] = [
  { value: "draft", label: "Draft, hidden from students" },
  { value: "open", label: "Open, taking entries" },
  { value: "closed", label: "Closed to new entries" },
  { value: "ongoing", label: "Running now" },
  { value: "completed", label: "Finished" },
  { value: "cancelled", label: "Cancelled" },
];

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label block text-muted">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-[0.85rem] leading-snug text-muted">{hint}</span> : null}
    </label>
  );
}

const input =
  "mt-2 w-full rounded-[var(--r-sm)] border-2 border-ink/15 bg-white px-4 py-2.5 text-[1rem] text-ink outline-none transition-colors focus:border-teal disabled:opacity-60";

/**
 * The one form that makes and edits an event.
 *
 * The size and capacity rules are stated here as hints and enforced twice
 * more, in the action and in a CHECK constraint. That is not belt and braces
 * for its own sake: a constraint violation surfaces as
 * "events_capacity_valid", which tells the person at the keyboard nothing, so
 * the hint and the action exist to name the field that is wrong while the
 * constraint stays the thing that is actually true.
 *
 * Team size drives the capacity ceiling, so it is the one piece of state this
 * component tracks. A solo event is a room full of people and takes 3000; a
 * team event is a room full of tables and takes 1000.
 */
export function EmsEventForm({
  action,
  defaults = {},
  submit,
  showStatus = false,
}: {
  action: Action;
  defaults?: EventDefaults;
  submit: string;
  showStatus?: boolean;
}) {
  const [state, dispatch, pending] = useActionState<EmsAdminState, FormData>(action, {});

  const [minSize, setMinSize] = useState(defaults.min_team_size ?? 1);
  const [maxSize, setMaxSize] = useState(defaults.max_team_size ?? 1);

  const solo = minSize === 1 && maxSize === 1;
  const ceiling = solo ? 3000 : 1000;

  return (
    <form action={dispatch}>
      {defaults.id ? <input type="hidden" name="event_id" value={defaults.id} /> : null}

      <div className="grid gap-5">
        <Field label="Name">
          <input
            name="name"
            required
            minLength={2}
            defaultValue={defaults.name ?? ""}
            disabled={pending}
            className={input}
            placeholder="Attack on Token"
          />
        </Field>

        <Field label="What it is" hint="One or two lines. The event's own page carries the detail.">
          <textarea
            name="description"
            rows={3}
            defaultValue={defaults.description ?? ""}
            disabled={pending}
            className={input}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Smallest team">
            <input
              type="number"
              name="min_team_size"
              min={1}
              max={8}
              required
              value={minSize}
              onChange={(event) => setMinSize(Number(event.target.value))}
              disabled={pending}
              className={input}
            />
          </Field>

          <Field label="Largest team">
            <input
              type="number"
              name="max_team_size"
              min={1}
              max={8}
              required
              value={maxSize}
              onChange={(event) => setMaxSize(Number(event.target.value))}
              disabled={pending}
              className={input}
            />
          </Field>

          <Field label="Entry fee" hint="Rupees. 0 registers straight away with nothing to pay.">
            <input
              type="number"
              name="price_inr"
              min={0}
              max={5000}
              step={1}
              required
              defaultValue={defaults.price_inr ?? 0}
              disabled={pending}
              className={input}
            />
          </Field>
        </div>

        <Field
          label={solo ? "How many entries" : "How many teams"}
          hint={
            solo
              ? "Up to 3000 for a solo event."
              : `Up to ${ceiling.toLocaleString("en-IN")} for a team event.`
          }
        >
          <input
            type="number"
            name="max_teams"
            min={1}
            max={ceiling}
            required
            defaultValue={defaults.max_teams ?? ""}
            disabled={pending}
            className={input}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Registration opens" hint="IST.">
            <input
              type="datetime-local"
              name="registration_start"
              required
              defaultValue={toISTInput(defaults.registration_start)}
              disabled={pending}
              className={input}
            />
          </Field>

          <Field label="Registration closes" hint="IST.">
            <input
              type="datetime-local"
              name="registration_end"
              required
              defaultValue={toISTInput(defaults.registration_end)}
              disabled={pending}
              className={input}
            />
          </Field>

          <Field label="Event starts" hint="IST.">
            <input
              type="datetime-local"
              name="event_start"
              required
              defaultValue={toISTInput(defaults.event_start)}
              disabled={pending}
              className={input}
            />
          </Field>

          <Field label="Event ends" hint="IST.">
            <input
              type="datetime-local"
              name="event_end"
              required
              defaultValue={toISTInput(defaults.event_end)}
              disabled={pending}
              className={input}
            />
          </Field>
        </div>

        {showStatus ? (
          <Field label="State">
            <select
              name="status"
              defaultValue={defaults.status ?? "draft"}
              disabled={pending}
              className={input}
            >
              {STATUSES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
      </div>

      {state.error ? (
        <div className="mt-5">
          <Notice tone="error">{state.error}</Notice>
        </div>
      ) : null}
      {state.notice ? (
        <div className="mt-5">
          <Notice tone="ok">{state.notice}</Notice>
        </div>
      ) : null}

      <button type="submit" disabled={pending} className="pill mt-5 disabled:opacity-60">
        {pending ? "Saving" : submit}
      </button>
    </form>
  );
}
