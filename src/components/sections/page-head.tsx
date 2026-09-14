import type { ReactNode } from "react";

import { Container, Label } from "@/components/aot/bits";

/**
 * The top of an interior page.
 *
 * Shorter than a hero on purpose: these pages are reached by someone who
 * already knows where they are going, so the title states the destination and
 * gets out of the way.
 */
export function PageHead({
  kicker,
  title,
  lede,
  aside,
}: {
  kicker: string;
  title: ReactNode;
  lede?: string;
  aside?: ReactNode;
}) {
  return (
    <header className="washi grain relative overflow-hidden pb-14 pt-32 sm:pb-20 sm:pt-40">
      <Container className="relative">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-[24ch]">
            <Label tone="teal">{kicker}</Label>
            <h1 className="d-tall mt-4 text-[clamp(2.8rem,9vw,6rem)] text-ink">{title}</h1>
          </div>
          {lede ? (
            <p className="max-w-[44ch] text-[1.05rem] leading-relaxed text-ink/75">{lede}</p>
          ) : null}
        </div>
        {aside}
      </Container>
    </header>
  );
}
