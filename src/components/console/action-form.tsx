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
 * `children` is plain ReactNode and must stay that way. It used to be a
 * render prop, `(pending) => ...`, so a caller could disable its own fields
 * while the action was in flight. That works from another client component
 * and throws from a server one, because a function cannot be serialized
 * across the boundary, and three of the five callers were server components:
 * /admin/events threw on every single render in production while building
 * and typechecking perfectly here. Wrap fields in <PendingFields> instead,
 * which reads the same pending state from inside the form. Typed as
 * ReactNode, the old shape no longer compiles.
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
  children?: ReactNode;
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
      {children}

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
