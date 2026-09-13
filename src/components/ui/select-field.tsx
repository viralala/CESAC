"use client";

import { useId, type ComponentPropsWithoutRef } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type SelectFieldProps = {
  label: string;
  hint?: string;
  containerClassName?: string;
} & ComponentPropsWithoutRef<"select">;

export function SelectField({
  label,
  hint,
  id,
  className,
  containerClassName,
  required,
  children,
  ...props
}: SelectFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const hintId = hint ? `${fieldId}-hint` : undefined;

  return (
    <div className={cn("flex flex-col gap-2", containerClassName)}>
      <label htmlFor={fieldId} className="font-mono text-xs uppercase tracking-wider text-fg-muted">
        {label}
        {required ? <span className="text-accent"> *</span> : null}
      </label>
      <div className="relative">
        <select
          id={fieldId}
          className={cn(
            "w-full appearance-none rounded-[4px] border border-line bg-ink-2 px-4 py-3 pr-10 text-sm text-fg transition-colors focus:border-accent focus:outline-none",
            className
          )}
          aria-describedby={hintId}
          required={required}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
          aria-hidden
        />
      </div>
      {hint ? (
        <p id={hintId} className="text-xs text-fg-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
