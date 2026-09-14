import Link from "next/link";

import { Container, Label } from "@/components/aot/bits";

export type LegalBlock = {
  heading: string;
  /** Paragraphs. A string that starts with "- " renders as a list item. */
  body: readonly string[];
};

/**
 * The shared frame for the policy pages.
 *
 * Deliberately plainer than the rest of the site: a single measure, no
 * stickers, no floating badges. Someone reading a privacy policy is trying to
 * find one fact, and decoration in the way of that is worse than useless.
 */
export function Legal({
  kicker,
  title,
  updated,
  intro,
  blocks,
}: {
  kicker: string;
  title: string;
  updated: string;
  intro: string;
  blocks: readonly LegalBlock[];
}) {
  return (
    <article className="washi grain relative min-h-[100svh] pb-24 pt-32 sm:pt-40">
      <Container className="relative">
        <header className="max-w-[62ch]">
          <Label tone="teal">{kicker}</Label>
          <h1 className="d-tall mt-4 text-[clamp(2.8rem,8vw,5.5rem)] text-ink">{title}</h1>
          <p className="label-sm mt-6 text-muted">Last updated: {updated}</p>
          <p className="mt-7 text-[1.05rem] leading-relaxed text-ink/80">{intro}</p>
        </header>

        <div className="mt-14 grid gap-3">
          {blocks.map((b) => (
            <section key={b.heading} className="card p-7 sm:p-9">
              <h2 className="d-tall text-[1.6rem] text-ink sm:text-[1.9rem]">{b.heading}</h2>
              <div className="mt-5 grid gap-4">
                {b.body.map((line) =>
                  line.startsWith("- ") ? (
                    <p
                      key={line}
                      className="relative max-w-[70ch] pl-6 text-[0.975rem] leading-relaxed text-ink/75 before:absolute before:left-0 before:top-[0.62em] before:h-[2px] before:w-3 before:bg-teal"
                    >
                      {line.slice(2)}
                    </p>
                  ) : (
                    <p key={line} className="max-w-[70ch] text-[0.975rem] leading-relaxed text-ink/75">
                      {line}
                    </p>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>

        <nav className="mt-10 flex flex-wrap gap-3">
          <Link href="/" className="pill pill-ghost">
            Back to CESAC
          </Link>
          <Link href="/privacy" className="pill pill-ghost">
            Privacy policy
          </Link>
          <Link href="/terms" className="pill pill-ghost">
            Terms and conditions
          </Link>
        </nav>
      </Container>
    </article>
  );
}
