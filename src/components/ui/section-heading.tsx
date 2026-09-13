import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/ui/eyebrow";

type SectionHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  tone?: "dark" | "light";
  className?: string;
  titleClassName?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "dark",
  className,
  titleClassName,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        align === "center" && "items-center text-center",
        className
      )}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2
        className={cn(
          "text-balance font-display text-4xl font-medium leading-[1.05] sm:text-5xl lg:text-6xl",
          tone === "dark" ? "text-fg" : "text-paper-fg",
          titleClassName
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "max-w-xl text-balance text-lg leading-relaxed",
            tone === "dark" ? "text-fg-muted" : "text-paper-fg-muted"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
