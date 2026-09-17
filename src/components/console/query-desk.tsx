"use client";

import { useActionState, useEffect, useId, useRef } from "react";

import { askQuestion, type QueryState } from "@/app/actions/queries";
import { Chip, Notice } from "@/components/console/shell";
import { TOPICS, TOPIC_LABEL } from "@/lib/console/options";
import type { Query } from "@/lib/data/queries";

function when(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATE: Record<string, { label: string; tone: "teal" | "lime" | "muted" }> = {
  open: { label: "Waiting", tone: "teal" },
  answered: { label: "Answered", tone: "lime" },
  closed: { label: "Closed", tone: "muted" },
};

/**
 * Ask the committee something, and read what they said.
 *
 * One place, so the question and its answer are never in two different apps.
 * Nothing here can be edited after sending, by the student or by anybody else:
 * a thread that can be rewritten afterwards is not a record, and the reason
 * this exists at all is that a group chat is not a record.
 */
export function QueryDesk({ queries }: { queries: Query[] }) {
  const [state, action, pending] = useActionState<QueryState, FormData>(askQuestion, {});
  const uid = useId();
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.notice) form.current?.reset();
  }, [state.notice]);

  return (
    <div className="grid gap-8">
      <form ref={form} action={action} className="grid gap-5">
        <div>
          <label htmlFor={`${uid}-topic`} className="label block text-ink">
            What is it about
          </label>
          <select
            id={`${uid}-topic`}
            name="topic"
            required
            defaultValue="other"
            aria-invalid={state.field === "topic" || undefined}
            className="field mt-2.5"
          >
            {TOPICS.map((topic) => (
              <option key={topic.value} value={topic.value}>
                {topic.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${uid}-subject`} className="label block text-ink">
            Subject
          </label>
          <input
            id={`${uid}-subject`}
            name="subject"
            type="text"
            required
            maxLength={160}
            placeholder="My certificate is not showing up"
            aria-invalid={state.field === "subject" || undefined}
            className={`field mt-2.5 ${state.field === "subject" ? "border-red" : ""}`}
          />
        </div>

        <div>
          <label htmlFor={`${uid}-body`} className="label block text-ink">
            The question
          </label>
          <textarea
            id={`${uid}-body`}
            name="body"
            required
            rows={5}
            maxLength={4000}
            placeholder="Say what happened and what you expected, so it can be answered in one go."
            aria-invalid={state.field === "body" || undefined}
            className={`field mt-2.5 rounded-[var(--r-md)] ${
              state.field === "body" ? "border-red" : ""
            }`}
          />
          <p className="serif-it mt-2 text-[0.85rem] text-muted">
            You can have five questions waiting at once.
          </p>
        </div>

        {state.error ? <Notice tone="error">{state.error}</Notice> : null}
        {state.notice ? <Notice tone="ok">{state.notice}</Notice> : null}

        <button
          type="submit"
          disabled={pending}
          className="pill pill-lime justify-self-start disabled:cursor-progress disabled:opacity-70"
        >
          {pending ? "Sending" : "Send it"}
        </button>
      </form>

      <div className="border-t-2 border-ink/10 pt-8">
        <h3 className="d-tall text-[1.35rem] text-ink">What you have asked</h3>

        {queries.length === 0 ? (
          <p className="serif-it mt-4 rounded-[var(--r-md)] border-2 border-dashed border-ink/15 bg-cream/60 px-6 py-7 text-[1.02rem] leading-relaxed text-muted">
            Nothing yet. Anything you send appears here with its answer underneath it.
          </p>
        ) : (
          <ul className="mt-4 grid gap-4">
            {queries.map((query) => {
              const shown = STATE[query.status] ?? STATE.open;
              return (
                <li key={query.id} className="rounded-[var(--r-md)] bg-cream-2 px-6 py-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                    <h4 className="label text-ink">{query.subject}</h4>
                    <Chip tone={shown.tone}>{shown.label}</Chip>
                  </div>
                  <p className="label-sm mt-1.5 text-muted">
                    {TOPIC_LABEL[query.topic] ?? "Something else"} {"·"}{" "}
                    {when(query.created_at)}
                  </p>
                  <p className="mt-3 whitespace-pre-line text-[0.98rem] leading-relaxed text-ink/80">
                    {query.body}
                  </p>

                  {query.answer ? (
                    <div className="mt-4 border-l-2 border-teal pl-5">
                      <p className="label-sm text-teal">
                        The committee
                        {query.answered_at ? ` · ${when(query.answered_at)}` : null}
                      </p>
                      <p className="mt-2 whitespace-pre-line text-[0.98rem] leading-relaxed text-ink">
                        {query.answer}
                      </p>
                    </div>
                  ) : (
                    <p className="serif-it mt-4 text-[0.9rem] text-muted">
                      Not answered yet. The answer lands here, and you do not need to ask again.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
