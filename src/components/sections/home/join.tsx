import Link from "next/link";

import { Container, Label } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import { Sticker } from "@/components/aot/stickers";
import { CESAC, CONTACT } from "@/lib/data/cesac";

/**
 * The close.
 *
 * Two real doors: enter the event that is running, or reach the committee. No
 * newsletter, no "join the community" button that goes nowhere, and no contact
 * address invented to fill the slot. If CONTACT.email is empty the card says
 * how to reach the department instead of printing a mailbox nobody reads.
 */
export function HomeJoin() {
  return (
    <section id="contact" className="scroll-mt-24 bg-cream px-0 pb-10 pt-4 sm:pb-16">
      <Container>
        <Reveal>
          <div className="washi-deep grain grain-dark relative overflow-hidden rounded-[var(--r-xl)] px-6 py-16 text-cream sm:px-10 sm:py-20 lg:px-14">
            <Sticker
              shape="scallop"
              pop="lime"
              rotate={-8}
              float={0.3}
              size="clamp(5rem,8vw,6.4rem)"
              className="absolute right-6 top-8 z-20 text-[clamp(0.66rem,1vw,0.8rem)] sm:right-12"
            >
              <span>
                Open
                <br />
                <span className="label-sm opacity-70">to all</span>
              </span>
            </Sticker>

            <div className="relative max-w-[46ch]">
              <Label tone="lime">Get involved</Label>
              <h2 className="d-tall mt-4 text-[clamp(2.6rem,7vw,5.25rem)] text-cream">
                Turn up,
                <br />
                or help run it
              </h2>
              <p className="mt-6 text-[1.05rem] leading-relaxed text-cream/70">
                Every {CESAC.department} student at {CESAC.short} can enter what CESAC runs.
                Committee intake happens through the department.
              </p>
            </div>

            <div className="relative mt-12 grid gap-3 lg:grid-cols-2">
              <div className="rounded-[var(--r-lg)] bg-cream/8 p-8 backdrop-blur-sm">
                <p className="label text-lime">Right now</p>
                <p className="d-tall mt-4 text-[1.9rem] text-cream">Attack on Token</p>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-cream/65">
                  A prompt engineering hackathon for teams of two. Fifty teams, three chapters, one
                  champion.
                </p>
                <Link
                  href="/events/attack-on-token"
                  className="pill pill-lime mt-7 px-7 py-3.5 text-[0.9rem]"
                >
                  Read the event
                </Link>
              </div>

              <div className="rounded-[var(--r-lg)] bg-cream/8 p-8 backdrop-blur-sm">
                <p className="label text-lime">Reach the committee</p>
                {CONTACT.email ? (
                  <>
                    <p className="d-tall mt-4 break-all text-[1.5rem] text-cream">
                      {CONTACT.email}
                    </p>
                    <a
                      href={`mailto:${CONTACT.email}`}
                      className="pill pill-ghost-light mt-7 px-7 py-3.5 text-[0.9rem]"
                    >
                      Send a mail
                    </a>
                  </>
                ) : (
                  <>
                    <p className="mt-4 text-[0.95rem] leading-relaxed text-cream/65">
                      {CONTACT.note}
                    </p>
                    <p className="label-sm mt-7 text-cream/45">
                      A committee inbox will be listed here once it is set up.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
