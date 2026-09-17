"use client";

import { useActionState, useId } from "react";

import { updatePassword, type AuthState } from "@/app/actions/auth";
import { Notice } from "@/components/console/shell";

export function PasswordForm({ forced = false }: { forced?: boolean }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, {});
  const uid = useId();

  return (
    <form action={action} className="mt-7 grid gap-5">
      <div>
        <label htmlFor={`${uid}-pw`} className="label block text-ink">
          New password
        </label>
        <input
          id={`${uid}-pw`}
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="••••••••"
          className="field mt-2.5"
        />
        <p className="serif-it mt-2 text-[0.85rem] text-muted">
          {forced
            ? "At least 8 characters, and not your email address."
            : "At least 8 characters."}
        </p>
      </div>

      <div>
        <label htmlFor={`${uid}-confirm`} className="label block text-ink">
          Again
        </label>
        <input
          id={`${uid}-confirm`}
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="••••••••"
          className="field mt-2.5"
        />
      </div>

      {state.error ? <Notice tone="error">{state.error}</Notice> : null}

      <button
        type="submit"
        disabled={pending}
        className="pill pill-lime w-full disabled:cursor-progress disabled:opacity-70"
      >
        {pending ? "Saving" : forced ? "Save it and continue" : "Save the password"}
      </button>
    </form>
  );
}
