"use client";

import { useActionState } from "react";

import { updatePassword, type AuthState } from "@/app/actions/auth";
import { Notice } from "@/components/console/shell";
import { PasswordField } from "@/components/sections/password-field";

export function PasswordForm({ forced = false }: { forced?: boolean }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(updatePassword, {});

  return (
    <form action={action} className="mt-7 grid gap-5">
      <PasswordField
        name="password"
        label="New password"
        autoComplete="new-password"
        required
        minLength={8}
        invalid={state.field === "password"}
        hint={
          forced ? "At least 8 characters, and not your email address." : "At least 8 characters."
        }
      />

      <PasswordField
        name="confirm"
        label="Again"
        autoComplete="new-password"
        required
        minLength={8}
        hint="Use the eye to check the two match before you save."
      />

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
