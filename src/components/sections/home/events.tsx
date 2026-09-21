import Link from "next/link";

import { WallMark } from "@/components/aot/art";
import { Arrow, Container, Label, SectionHead } from "@/components/aot/bits";
import { ParallaxLayer, ParallaxScene } from "@/components/aot/parallax";
import { Reveal } from "@/components/aot/reveal";
import { Sticker } from "@/components/aot/stickers";
import { RegisterButton } from "@/components/sections/event/register-button";
import { EVENTS } from "@/lib/data/cesac";
import { REGISTER_SLUG } from "@/lib/data/event";
import { badgeFor, getEventBadges } from "@/lib/data/event-status";
import { getCopy } from "@/lib/data/site";

/**
 * The events board.
 *
 * The first entry gets the full panel, because an event-first homepage should
 * show the thing that is actually happening rather than list it. Anything
 * after the first is a plain card.
 *
 * One event is listed because one event exists. If this ever renders a thin
 * list, that is the honest state of the calendar, not a bug to pad.
 */
export async function HomeEvents() {
  const [feature, ...rest] = EVENTS;
  const [badges, t] = await Promise.all([getEventBadges(), getCopy()]);
  const featureBadge = feature ? badgeFor(feature, badges) : null;

  return (
    <section id="events" className="washi grain relative scroll-mt-24 py-20 sm:py-24">
      <Container className="relative">
        <Reveal>
          <SectionHead
            eyebrow={t("home.events.eyebrow")}
            title={t("home.events.title")}
            aside={t("home.events.aside")}
          />
        </Reveal>

        {feature ? (
          <Reveal className="mt-14">
            <article className="washi-deep grain grain-dark relative isolate overflow-hidden rounded-[var(--r-xl)] text-cream">
              <div className="grid items-stretch gap-0 lg:grid-cols-[1.08fr_0.92fr]">
                <div className="relative z-20 px-7 py-12 sm:px-11 sm:py-16">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className="label-sm rounded-full px-4 py-2"
                      style={{
                        background: featureBadge?.bg,
                        color: featureBadge?.fg,
                      }}
                    >
                      {featureBadge?.label}
                    </span>
                    <Label tone="light">{feature.kicker}</Label>
                  </div>

                  <h3 className="d-tall mt-7 text-[clamp(2.6rem,7vw,4.8rem)] text-cream">
                    {feature.name}
                  </h3>
                  <p className="jp mt-3 text-[clamp(1rem,1.8vw,1.35rem)] text-lime">
                    {feature.jp}
                  </p>

                  <p className="mt-6 max-w-[46ch] text-[1rem] leading-relaxed text-cream/75">
                    {feature.blurb}
                  </p>

                  <p className="label mt-8 text-cream/45">{feature.when}</p>

                  <div className="mt-9 flex flex-wrap gap-3">
                    <Link href={feature.href} className="pill pill-lime px-7 py-3.5">
                      Open the event
                      <Arrow />
                    </Link>
                    {/* The way in, where there is one. Attack on Token takes
                        its teams on a form rather than through the console, so
                        the second button is that form and not a sign-in box
                        that leads nowhere near it. */}
                    {feature.slug === REGISTER_SLUG ? (
                      <RegisterButton
                        tone="ghost-light"
                        fallbackHref={`${feature.href}#register`}
                      />
                    ) : (
                      <Link href="/signin" className="pill pill-ghost-light">
                        Sign in
                      </Link>
                    )}
                  </div>
                </div>

                {/* The plate. There is no figure on this site, so the panel is
                    closed with masonry, the event's own name set vertically,
                    and one lit mass, all on parallax planes. */}
                <div className="relative min-h-[260px] overflow-hidden lg:min-h-[460px]">
                  <ParallaxScene className="pointer-events-none absolute inset-0">
                    <ParallaxLayer depth={9} drift={-14} className="absolute inset-0">
                      <WallMark className="absolute bottom-0 left-1/2 h-[96%] w-auto -translate-x-1/2 text-cream opacity-[0.09]" />
                    </ParallaxLayer>
                    <ParallaxLayer depth={28} drift={-26} className="absolute inset-0">
                      <span
                        aria-hidden
                        className="absolute left-[16%] top-[16%] aspect-square h-[42%] rounded-full bg-lime opacity-25 blur-2xl"
                      />
                    </ParallaxLayer>
                  </ParallaxScene>

                  <span
                    aria-hidden
                    className="jp pointer-events-none absolute right-6 top-8 select-none text-[clamp(2rem,3.6vw,3.2rem)] leading-[1.05] text-cream/[0.16] [writing-mode:vertical-rl]"
                  >
                    {feature.jp}
                  </span>

                  <Sticker
                    shape="octo"
                    pop="pink"
                    rotate={-8}
                    float={0.6}
                    size="clamp(4.4rem,7vw,5.6rem)"
                    className="absolute left-[6%] top-[12%] z-30 hidden text-[0.66rem] sm:grid"
                  >
                    <span>
                      80
                      <br />
                      <span className="opacity-80">teams</span>
                    </span>
                  </Sticker>
                </div>
              </div>
            </article>
          </Reveal>
        ) : null}

        {rest.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((e, i) => (
              <Reveal key={e.slug} delay={i * 70}>
                <Link
                  href={e.href}
                  className="card group flex h-full flex-col p-7 transition-transform duration-300 hover:-translate-y-1"
                >
                  <span
                    className="label-sm w-fit rounded-full px-3.5 py-1.5"
                    style={{ background: badgeFor(e, badges).bg, color: badgeFor(e, badges).fg }}
                  >
                    {badgeFor(e, badges).label}
                  </span>
                  <h3 className="d-tall mt-5 text-[1.9rem] text-ink">{e.name}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink/70">{e.blurb}</p>
                  <p className="label-sm mt-auto pt-6 text-muted">{e.when}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        ) : (
          <Reveal className="mt-4">
            <p className="rounded-[var(--r-lg)] bg-cream-2 px-7 py-6 text-[0.95rem] text-muted">
              {t("home.events.empty")}
            </p>
          </Reveal>
        )}
      </Container>
    </section>
  );
}
