import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[4px] font-sans font-semibold uppercase tracking-wide transition-colors motion-safe:duration-150 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "bg-accent text-ink hover:bg-accent-strong",
        secondary:
          "border border-line text-fg hover:border-accent hover:text-accent",
        ghost:
          "text-fg underline decoration-transparent underline-offset-4 hover:decoration-current px-0! normal-case tracking-normal font-medium",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-12 px-6 text-sm",
        lg: "h-14 px-8 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

type ButtonProps = ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

type LinkButtonProps = ComponentPropsWithoutRef<typeof Link> &
  VariantProps<typeof buttonVariants>;

export function LinkButton({
  className,
  variant,
  size,
  ...props
}: LinkButtonProps) {
  return (
    <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
