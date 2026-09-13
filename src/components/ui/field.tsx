"use client";

import { useId, type ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

const controlClasses =
  "w-full rounded-[4px] border border-line bg-ink-2 px-4 py-3 text-sm text-fg placeholder:text-fg-muted/60 transition-colors focus:border-accent focus:outline-none";

type BaseFieldProps = {
  label: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
};

type InputFieldProps = BaseFieldProps & ComponentPropsWithoutRef<"input">;

export function InputField({
  label,
  hint,
  error,
  id,
  className,
  containerClassName,
  required,
  ...props
}: InputFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <div className={cn("flex flex-col gap-2", containerClassName)}>
      <label htmlFor={fieldId} className="font-mono text-xs uppercase tracking-wider text-fg-muted">
        {label}
        {required ? <span className="text-accent"> *</span> : null}
      </label>
      <input
        id={fieldId}
        className={cn(controlClasses, error && "border-danger", className)}
        aria-describedby={cn(hintId, errorId) || undefined}
        aria-invalid={Boolean(error)}
        required={required}
        {...props}
      />
      {hint ? (
        <p id={hintId} className="text-xs text-fg-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type TextareaFieldProps = BaseFieldProps & ComponentPropsWithoutRef<"textarea">;

export function TextareaField({
  label,
  hint,
  error,
  id,
  className,
  containerClassName,
  required,
  rows = 5,
  ...props
}: TextareaFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <div className={cn("flex flex-col gap-2", containerClassName)}>
      <label htmlFor={fieldId} className="font-mono text-xs uppercase tracking-wider text-fg-muted">
        {label}
        {required ? <span className="text-accent"> *</span> : null}
      </label>
      <textarea
        id={fieldId}
        rows={rows}
        className={cn(controlClasses, "resize-none", error && "border-danger", className)}
        aria-describedby={cn(hintId, errorId) || undefined}
        aria-invalid={Boolean(error)}
        required={required}
        {...props}
      />
      {hint ? (
        <p id={hintId} className="text-xs text-fg-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
