import Image from "next/image";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { LinkButton } from "@/components/ui/button";

type CtaAction = {
  href: string;
  label: string;
};

type CTABlockProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  primary: CtaAction;
  secondary?: CtaAction;
  className?: string;
};

export function CTABlock({ eyebrow, title, description, primary, secondary, className }: CTABlockProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden border border-line px-6 py-12 sm:px-12 sm:py-16",
        className
      )}
    >
      <Image
        src="/images/vit-campus-courtyard.jpg"
        alt=""
        fill
        aria-hidden
        className="object-cover"
        sizes="(min-width: 1440px) 1400px, 100vw"
      />
      <div aria-hidden className="absolute inset-0 z-[1] bg-ink/88" />
      <div className="relative z-[2] mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        {eyebrow ? (
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent">{eyebrow}</span>
        ) : null}
        <h2 className="text-balance font-display text-4xl font-medium leading-[1.05] text-fg sm:text-5xl">
          {title}
        </h2>
        {description ? (
          <p className="text-balance text-lg leading-relaxed text-fg-muted">{description}</p>
        ) : null}
        <div className="mt-2 flex flex-wrap justify-center gap-4">
          <LinkButton href={primary.href} variant="primary" size="lg">
            {primary.label}
          </LinkButton>
          {secondary ? (
            <LinkButton href={secondary.href} variant="secondary" size="lg">
              {secondary.label}
            </LinkButton>
          ) : null}
        </div>
      </div>
    </div>
  );
}
