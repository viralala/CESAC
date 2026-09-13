import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";

type SectionProps = ComponentPropsWithoutRef<"section"> & {
  tone?: "ink" | "paper";
  containerClassName?: string;
};

export function Section({ tone = "ink", className, containerClassName, children, ...props }: SectionProps) {
  return (
    <section
      className={cn(
        "py-20 sm:py-28",
        tone === "paper" && "bg-paper text-paper-fg",
        className
      )}
      {...props}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}
