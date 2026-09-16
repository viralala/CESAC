import Link from "next/link";

import { Container, Label } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import { Sticker } from "@/components/aot/stickers";
import { getEventStats } from "@/lib/data/console";
import { ENTRY, EVENT } from "@/lib/data/event";

/**
 * The close. Three steps, one button, and the two facts still outstanding
 * (date, venue) stated plainly instead of hidden — a duo deciding tonight
 * needs to know what is and is not locked.
 */
export async function EventEnlist() {
  const stats = await getEventStats();
  const seatsLeft = Math.max(stats.seats_cap - stats.seats_taken, 0);
  const full = stats.registration_open && seatsLeft === 0;

  return (
    <section id="enlist" className="scroll-mt-24 bg-cream py-10 sm:py-16">
      <Container>
        <Reveal>
          <div className="washi-red-deep deck-frame grain grain-dark relative overflow-hidden rounded-[var(--r-xl)] px-6 py-16 text-cream sm:px-10 sm:py-20 lg:px-14">
            <Sticker
              shape="scallop"
              pop="lime"
              rotate={-8}
              float={0.3}
              size="clamp(5rem,8vw,6.4rem)"
              className="absolute right-6 top-8 z-20 text-[clamp(0.66rem,1vw,0.8rem)] sm:right-12"
            >
              <span>
                {stats.registration_open ? seatsLeft : stats.seats_cap * 2}
                <br />
                <span className="label-sm opacity-70">
                  {stats.registration_open ? "seats left" : "seats"}
                </span>
              </span>
            </Sticker>

            <div className="relative max-w-[46ch]">
              <Label tone="lime">Enlist</Label>
              <h2 className="d-tall mt-4 text-[clamp(2.6rem,7vw,5.25rem)] text-cream">
                Bring one
                <br />
                partner
              </h2>
              <p className="jp mt-6 text-[clamp(0.95rem,1.7vw,1.3rem)] leading-snug text-cream/80">
                プロンプトを鍛えろ。トークンを生き延びろ。
              </p>
              <p className="serif-it mt-3 text-[1.05rem] leading-snug text-cream/60">
                &ldquo;{EVENT.creed}&rdquo;
              </p>
            </div>

            <ol className="relative mt-14 grid gap-3 lg:grid-cols-3">
              {ENTRY.map((e, i) => (
                <Reveal key={e.step} delay={i * 90} as="li">
                  <div className="h-full rounded-[var(--r-lg)] bg-cream/8 p-7 backdrop-blur-sm">
                    <span className="d-wide text-[2.75rem] leading-none text-lime">{e.step}</span>
                    <p className="d-tall mt-4 text-[1.5rem] text-cream">{e.title}</p>
                    <p className="serif-it mt-1.5 text-[0.95rem] text-cream/60">{e.note}</p>
                  </div>
                </Reveal>
              ))}
            </ol>

            <div className="relative mt-12 flex flex-wrap items-center gap-4">
              {/*
                Live, not decorative: the button reads what organisers have
                actually switched on. Inviting a duo to register into a closed
                form is how a site loses them.
              */}
              {full ? (
                <span className="pill pointer-events-none px-8 py-4 text-[0.95rem] opacity-70">
                  All {stats.seats_cap} teams are in
                </span>
              ) : (
                <Link
                  href={stats.registration_open ? "/signup" : "/signup?next=%2Fdashboard"}
                  className="pill pill-lime px-8 py-4 text-[0.95rem]"
                >
                  {stats.registration_open ? "Enlist now" : "Make an account"}
                </Link>
              )}
              <a href="#chapters" className="pill pill-ghost-light">
                Re-read the chapters
              </a>
              <p className="label-sm ml-auto text-cream/50">{EVENT.dateVenue}</p>
            </div>

            {!stats.registration_open ? (
              <p className="serif-it relative mt-6 max-w-[54ch] text-[1rem] leading-relaxed text-cream/60">
                Registration has not opened yet. Make an account now and the console will let you
                build your team the moment it does, ahead of everyone who waits.
              </p>
            ) : null}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
