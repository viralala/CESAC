import type { Metadata } from "next";
import Link from "next/link";

import { Container, Label } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import { PageHead } from "@/components/sections/page-head";
import { SiteFooter } from "@/components/site/footer";
import { getAotContent } from "@/lib/data/event-content";
import { faqFor } from "@/lib/data/faq";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Questions about CESAC, signing in, entering events, your record, the standouts and the site, answered.",
  alternates: { canonical: "/faq" },
};

/**
 * Questions, answered once.
 *
 * Linked from the menu on every page and from the footer, so it is one click
 * from wherever the question came up. Each answer is a native <details>: it
 * opens with a keyboard, is read properly by a screen reader, and works with
 * JavaScript switched off, which a hand-rolled accordion would have to earn.
 *
 * The words live in lib/data/faq.ts, next to the rule that they describe the
 * site as built.
 */
export default async function FaqPage() {
  const FAQ = faqFor((await getAotContent()).register);
  const total = FAQ.reduce((n, g) => n + g.items.length, 0);

  return (
    <>
      <PageHead
        kicker="FAQ"
        title="Questions"
        lede={`The ${total} things people ask most, about the committee, signing in, events, your record and the site itself.`}
      />

      <section className="bg-cream pb-20 pt-4 sm:pb-24">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[14rem_1fr]">
            <nav aria-label="Topics" className="lg:sticky lg:top-28 lg:self-start">
              <Label tone="muted">Topics</Label>
              <ul className="mt-3 flex flex-wrap gap-2 lg:grid lg:gap-1">
                {FAQ.map((group) => (
                  <li key={group.id}>
                    <a
                      href={`#${group.id}`}
                      className="label inline-flex rounded-full px-3.5 py-2 text-ink transition-colors hover:bg-cream-2 lg:flex"
                    >
                      {group.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="grid gap-6">
              {FAQ.map((group, gi) => (
                <Reveal key={group.id} delay={gi * 40}>
                  <section id={group.id} className="card scroll-mt-28 p-6 sm:p-9">
                    <h2 className="d-tall text-[clamp(1.8rem,4vw,2.4rem)] text-ink">{group.title}</h2>
                    <div className="mt-4 grid">
                      {group.items.map((item) => (
                        <details
                          key={item.q}
                          className="group border-b border-ink/10 py-1 last:border-0"
                        >
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-[1.05rem] font-semibold text-ink [&::-webkit-details-marker]:hidden">
                            {item.q}
                            <span
                              aria-hidden
                              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cream-2 text-teal transition-transform group-open:rotate-45"
                            >
                              +
                            </span>
                          </summary>
                          <div className="grid gap-3 pb-5 pr-2 sm:pr-14">
                            {item.a.map((para) => (
                              <p key={para} className="text-[0.98rem] leading-relaxed text-ink/80">
                                {para}
                              </p>
                            ))}
                          </div>
                        </details>
                      ))}
                    </div>
                  </section>
                </Reveal>
              ))}

              <div className="rounded-[var(--r-xl)] bg-cream-2 px-8 py-7">
                <p className="d-tall text-[1.5rem] text-ink">Not here?</p>
                <p className="serif-it mt-1 max-w-[62ch] text-[0.98rem] leading-relaxed text-muted">
                  Ask from the Questions tab in your console, and the answer comes back to the same
                  place. Signing in is the only thing it needs.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href="/dashboard/queries" className="pill pill-lime">
                    Ask a question
                  </Link>
                  <Link href="/signin/help" className="pill pill-ghost">
                    Sign-in help
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <SiteFooter />
    </>
  );
}
