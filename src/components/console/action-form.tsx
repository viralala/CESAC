"use client";

import { useActionState, type ReactNode } from "react";

import { Notice } from "@/components/console/shell";
import type { AdminState } from "@/app/actions/admin";

type Action = (state: AdminState, formData: FormData) => Promise<AdminState>;

/**
 * One form wrapper for the whole organiser console.
 *
 * Every control in there is a server action that either works or comes back
 * with a sentence saying why not, and each one needs the same three things:
 * a pending state, a place to put the message, and a submit button that goes
 * quiet while it is working. Writing that once is the difference between a
 * console with feedback everywhere and one that silently does nothing when a
 * call fails.
 *
 * `children` is a render prop so the caller can disable its own fields while
 * the action is in flight.
 */
export function ActionForm({
  action,
  submit,
  pendingLabel,
  tone = "ghost",
  className = "",
  children,
  confirm,
}: {
  action: Action;
  submit: string;
  pendingLabel?: string;
  tone?: "ghost" | "solid" | "lime" | "danger";
  className?: string;
  children?: ReactNode | ((pending: boolean) => ReactNode);
  /** Shown in a browser confirm before anything is sent. For the cut. */
  confirm?: string;
}) {
  const [state, dispatch, pending] = useActionState<AdminState, FormData>(action, {});

  const skin = {
    ghost: "pill pill-ghost",
    solid: "pill",
    lime: "pill pill-lime",
    danger:
      "label rounded-full border-2 border-red/40 px-5 py-2.5 text-red-deep transition-colors hover:bg-red/10",
  }[tone];

  return (
    <form
      action={dispatch}
      className={className}
      onSubmit={(event) => {
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      {typeof children === "function" ? children(pending) : children}

      {state.error ? (
        <div className="mt-4">
          <Notice tone="error">{state.error}</Notice>
        </div>
      ) : null}
      {state.notice ? (
        <div className="mt-4">
          <Notice tone="ok">{state.notice}</Notice>
        </div>
      ) : null}

      <button type="submit" disabled={pending} className={`${skin} mt-4 disabled:opacity-60`}>
        {pending ? (pendingLabel ?? "Working") : submit}
      </button>
    </form>
  );
}
