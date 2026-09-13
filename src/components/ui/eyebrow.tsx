import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export function Eyebrow({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"p">) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[0.2em] text-accent",
        className
      )}
      {...props}
    >
      <span aria-hidden className="h-px w-8 bg-accent" />
      {children}
    </p>
  );
}
