"use client";

import { useId, useState } from "react";

/**
 * A password box you can look inside.
 *
 * Typing a password you cannot see, twice, on a phone keyboard, is how people
 * end up locked out of an account they just made. The eye is not a
 * convenience: it is the difference between "I set a password" and "I set
 * something, and I hope it was the password".
 *
 * It starts hidden and goes back to hidden on its own the moment the field
 * loses focus, so a revealed password does not sit on screen in a lab full of
 * people while the student reaches for their phone. Nothing is remembered
 * between renders and the value never leaves the input.
 */
export function PasswordField({
  name,
  label,
  autoComplete,
  required = false,
  minLength,
  defaultValue,
  invalid = false,
  hint,
  id: given,
}: {
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  required?: boolean;
  minLength?: number;
  defaultValue?: string;
  invalid?: boolean;
  hint?: string;
  id?: string;
}) {
  const uid = useId();
  const id = given ?? `${uid}-${name}`;
  const [shown, setShown] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="label block text-ink">
        {label}
      </label>

      <div className="relative mt-2.5">
        <input
          id={id}
          name={name}
          type={shown ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          defaultValue={defaultValue}
          aria-invalid={invalid || undefined}
          // Room for the eye, so a long password does not run underneath it.
          className={`field pr-[3.6rem] ${invalid ? "border-red" : ""}`}
          placeholder={shown ? "" : "••••••••"}
          onBlur={() => setShown(false)}
        />

        <button
          type="button"
          // Not in the tab order: somebody tabbing from the password to the
          // submit button wants the submit button, and this sits between them.
          tabIndex={-1}
          // Keeping focus in the input is what makes the blur above mean
          // anything. Without this the click moves focus to the button, the
          // field never blurs again, and a revealed password stays revealed
          // until somebody thinks to press the eye a second time.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => setShown((was) => !was)}
          aria-pressed={shown}
          aria-controls={id}
          aria-label={shown ? "Hide the password" : "Show the password"}
          title={shown ? "Hide" : "Show"}
          className="absolute inset-y-[3px] right-[3px] flex w-[3.2rem] items-center justify-center rounded-full text-muted transition-colors hover:bg-cream-2 hover:text-ink"
        >
          <Eye open={shown} />
        </button>
      </div>

      {hint ? <p className="serif-it mt-2 text-[0.85rem] text-muted">{hint}</p> : null}
    </div>
  );
}

/** Drawn rather than imported, like every other mark on the site. */
function Eye({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[1.15rem] w-[1.15rem]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.75" />
      {open ? <path d="m3.5 3.5 17 17" /> : null}
    </svg>
  );
}
