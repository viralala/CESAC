import { Container } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import { BossFile } from "@/components/hrfb/boss-file";

export function HrfbBoss() {
  return (
    <section id="boss-file" className="grid-box-deep scroll-mt-24 py-16 sm:py-24">
      <Container>
        <Reveal>
          <div className="max-w-[46ch]">
            <p className="label-sm text-hb-maya">Speaker</p>
            <h2 className="hb-display mt-4 text-[clamp(2.4rem,6.5vw,4.4rem)] uppercase leading-[0.94] text-hb-ghost">
              Locked for now.
            </h2>
            <p className="mt-5 text-[1rem] leading-relaxed text-hb-ghost/70">
              The speaker is not named on this page yet, on purpose. Here is what the file will
              confirm: thirty plus years in HR, based in Africa, and a two to three hour session
              built to be answered live rather than read off a slide.
            </p>
          </div>
        </Reveal>

        <Reveal delay={90} className="mt-10">
          <BossFile />
        </Reveal>
      </Container>
    </section>
  );
}
