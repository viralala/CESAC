import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-[3px] border font-mono text-[11px] font-medium uppercase tracking-wider",
  {
    variants: {
      variant: {
        outline: "border-line text-fg-muted",
        accent: "border-accent/40 bg-accent/10 text-accent-soft",
        solid: "border-transparent bg-fg text-ink",
        paper: "border-paper-line text-paper-fg-muted",
      },
      size: {
        sm: "px-2 py-0.5",
        md: "px-2.5 py-1",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "sm",
    },
  }
);

type BadgeProps = ComponentPropsWithoutRef<"span"> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
