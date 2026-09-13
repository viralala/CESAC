import Link from "next/link";

import { Container, Label, NumDot, SectionHead } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import { Seal } from "@/components/aot/seal";
import { EVENT, SPONSOR_SLOTS, WHY } from "@/lib/data/event";

export function Sponsor() {
  return (
    <section id="sponsor" className="washi grain relative scroll-mt-24 py-24 sm:py-32">
      <Container className="relative">
        <Reveal>
          <SectionHead
            eyebrow="Budget / sponsorship"
            title="Fund the experience"
            lede="A transparent budget framework keeps sponsor asks disciplined and event delivery credible."
          />
        </Reveal>

        <div className="mt-14 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <div className="h-full rounded-[var(--r-xl)] bg-teal p-9 text-cream">
              <p className="d-wide text-[clamp(2.8rem,6vw,4rem)] leading-none">₹10,000</p>
              <p className="serif-it mt-5 max-w-[32ch] text-[1.05rem] leading-relaxed text-cream/75">
                Known revenue ceiling at full capacity — 50 teams × ₹200, before sponsorship. Every
                cost centre beyond that (tools, model APIs, print, prizes, AV, key art, contingency)
                is still open.
              </p>
              <p className="label-sm mt-8 border-t border-cream/20 pt-6 text-cream/55">
                Package tier: Title / Powered-by / Chapter / Tech / Award / Showcase
              </p>
            </div>
          </Reveal>

          <div>
            <Reveal>
              <Label>Why sponsors should care</Label>
            </Reveal>
            <dl className="mt-6 grid gap-7">
              {WHY.map((w, i) => (
                <Reveal key={w.n} delay={i * 80}>
                  <div className="flex gap-5">
                    <NumDot n={w.n} />
                    <div>
                      <dt className="d-tall text-xl text-ink">{w.title}</dt>
                      <dd className="mt-2 max-w-[54ch] text-[0.9375rem] leading-relaxed text-muted">
                        {w.body}
                      </dd>
                    </div>
                  </div>
                </Reveal>
              ))}
            </dl>
          </div>
        </div>

        <Reveal className="mt-16">
          <Label>Sponsor activation inventory</Label>
        </Reveal>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SPONSOR_SLOTS.map((s, i) => (
            <Reveal key={s.title} delay={i * 55}>
              <div className="h-full rounded-[var(--r-lg)] border-2 border-ink/10 bg-white p-6 transition-colors hover:border-red">
                <p className="d-tall text-[1.3rem] text-ink">{s.title}</p>
                <p className="serif-it mt-2 text-[0.95rem] leading-relaxed text-muted">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* closing call to action */}
        <Reveal className="mt-20">
          <div className="flex flex-col items-start gap-9 rounded-[var(--r-xl)] bg-white p-9 shadow-[0_28px_70px_-44px_rgba(21,20,26,0.7)] sm:p-12 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="d-tall text-[clamp(2.2rem,5.5vw,3.75rem)] text-ink">
                Fifty teams enter.
                <br />
                <span className="text-red">One walks out.</span>
              </h2>
              <p className="serif-it mt-5 max-w-[48ch] text-[1.05rem] leading-relaxed text-muted">
                {EVENT.dateVenue}. Registration is ₹200 per two-person team. Sponsors and partners
                can reach the Industry and Outreach vertical through the committee.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/signin" className="pill pill-red">
                  Enlist now
                </Link>
                <Link href="/signin?role=admin" className="pill pill-ghost">
                  Organiser sign in
                </Link>
              </div>
            </div>

            <Seal
              className="hidden w-[160px] shrink-0 text-ink lg:block"
              text="SPONSOR · PARTNER · JUDGE · MENTOR · CESAC VIT PUNE · "
              center={
                <>
                  Join
                  <br />
                  Us
                </>
              }
            />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
