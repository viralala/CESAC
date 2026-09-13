import type { ReactNode } from "react";

import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";

type PageHeaderProps = {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="border-b border-line bg-ink-2/40 py-16 sm:py-20">
      <Container className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex max-w-3xl flex-col gap-5">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="text-balance font-display text-5xl font-medium leading-[1.05] text-fg sm:text-6xl">
              {title}
            </h1>
            {description ? (
              <p className="max-w-xl text-balance text-lg leading-relaxed text-fg-muted">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      </Container>
    </div>
  );
}
