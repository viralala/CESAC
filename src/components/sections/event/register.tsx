import { Container, Label } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import { Sticker } from "@/components/aot/stickers";
import { RegisterButton } from "@/components/sections/event/register-button";
import { getAotContent } from "@/lib/data/event-content";

/**
 * The close, and the last thing on the page.
 *
 * It says what the four steps are and then gets out of the way. Registering
 * and paying both happen on the form, so this panel carries one button and
 * does not try to do half the form's job in front of it: the payment code
 * sits next to the box that asks for the reference, which is the only place
 * the two are any use to each other.
 *
 * There is no live seat count here. The number would have to come from the
 * console, the console no longer takes these entries, and a counter reading
 * zero next to a full event is worse than no counter.
 */
export async function EventRegister() {
  const { entry, event, register, vitals } = await getAotContent();
  const perHead = (register.amountInr / 2).toFixed(register.amountInr % 2 ? 2 : 0);
  // The sticker repeats the cap from the vitals, so changing one changes both.
  const teams = vitals.find((v) => v.label.trim().toLowerCase() === "teams")?.value;

  return (
    <section id="register" className="scroll-mt-24 bg-cream py-10 sm:py-16">
      <Container>
        <Reveal>
          <div className="washi-red-deep deck-frame grain grain-dark relative overflow-hidden rounded-[var(--r-xl)] px-6 py-16 text-cream sm:px-10 sm:py-20 lg:px-14">
            {teams ? (
            <Sticker
              shape="scallop"
              pop="lime"
              rotate={-8}
              float={0.3}
              size="clamp(5rem,8vw,6.4rem)"
              className="absolute right-6 top-8 z-20 text-[clamp(0.66rem,1vw,0.8rem)] sm:right-12"
            >
              <span>
                {teams}
                <br />
                <span className="label-sm opacity-70">teams</span>
              </span>
            </Sticker>
            ) : null}

            <div className="relative max-w-[46ch]">
              <Label tone="lime">Register</Label>
              <h2 className="d-tall mt-4 text-[clamp(2.6rem,7vw,5.25rem)] text-cream">
                Bring one
                <br />
                partner
              </h2>
              <p className="jp mt-6 text-[clamp(0.95rem,1.7vw,1.3rem)] leading-snug text-cream/80">
                プロンプトを鍛えろ。トークンを生き延びろ。
              </p>
              <p className="serif-it mt-3 text-[1.05rem] leading-snug text-cream/60">
                &ldquo;{event.creed}&rdquo;
              </p>
            </div>

            <ol className="relative mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {entry.map((e, i) => (
                <Reveal key={e.step} delay={i * 90} as="li">
                  <div className="h-full rounded-[var(--r-lg)] bg-cream/8 p-7 backdrop-blur-sm">
                    <span className="d-wide text-[2.75rem] leading-none text-lime">{e.step}</span>
                    <p className="d-tall mt-4 text-[1.5rem] text-cream">{e.title}</p>
                    <p className="serif-it mt-1.5 text-[0.95rem] text-cream/60">{e.note}</p>
                  </div>
                </Reveal>
              ))}
            </ol>

            <Reveal>
              <div className="relative mt-12 border-t border-cream/15 pt-10">
                <p className="serif-it max-w-[54ch] text-[clamp(1.05rem,1.7vw,1.25rem)] leading-relaxed text-cream/75">
                  One form, both of you on it, and the payment code is on the form itself. Have
                  your partner&rsquo;s VIT address and a UPI app to hand and it takes about two
                  minutes.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <RegisterButton formUrl={register.formUrl} />
                  <a href="#chapters" className="pill pill-ghost-light">
                    Re-read the chapters
                  </a>
                  <p className="label-sm ml-auto text-cream/50">{event.dateVenue}</p>
                </div>

                {register.live ? (
                  <p className="serif-it mt-6 max-w-[54ch] text-[0.98rem] leading-relaxed text-cream/55">
                    &#8377;{register.amountInr} for the team, so &#8377;{perHead} a head. Every payment
                    is checked against the account by hand, so register once and give us a day or
                    two rather than paying twice.
                  </p>
                ) : (
                  <p className="serif-it mt-6 max-w-[54ch] text-[1rem] leading-relaxed text-cream/60">
                    The form is not open yet. Everything else on this page is settled, so read the
                    chapters, find your partner, and check back here for the link.
                  </p>
                )}
              </div>
            </Reveal>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
