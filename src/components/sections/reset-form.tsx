"use client";

import { useActionState, useId } from "react";

import { requestPasswordReset, type AuthState } from "@/app/actions/auth";
import { Notice } from "@/components/console/shell";

/**
 * The answer is the same whether or not that address has an account, which is
 * deliberate: anything else turns this form into a way of finding out who has
 * registered.
 */
export function ResetForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(requestPasswordReset, {});
  const uid = useId();

  return (
    <form action={action} className="mt-7 grid gap-5">
      <div>
        <label htmlFor={`${uid}-email`} className="label block text-ink">
          Email
        </label>
        <input
          id={`${uid}-email`}
          key={`email-${state.email ?? ""}`}
          name="email"
          type="email"
          defaultValue={state.email}
          autoComplete="email"
          required
          placeholder="you@vit.edu"
          className="field mt-2.5"
        />
      </div>

      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      {state.notice ? <Notice tone="ok">{state.notice}</Notice> : null}

      <button
        type="submit"
        disabled={pending}
        className="pill w-full disabled:cursor-progress disabled:opacity-70"
      >
        {pending ? "Sending" : "Send the link"}
      </button>
    </form>
  );
}
