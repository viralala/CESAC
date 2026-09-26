import { Container } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import { getAotContent } from "@/lib/data/event-content";

/** One colour per plate, so the strip reads as four facts and not one block. */
const POPS = ["var(--azure)", "var(--violet)", "var(--lime)", "var(--pink)"];
const FG = ["var(--ink)", "var(--white)", "var(--ink)", "var(--white)"];

/**
 * The four numbers that decide whether a duo enters, given the whole width and
 * no supporting paragraph. If a reader takes one thing from the page above the
 * fold, it should be these.
 */
export async function EventVitals() {
  const { vitals } = await getAotContent();

  return (
    <section className="bg-cream py-14 sm:py-20">
      <Container>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {vitals.map((v, i) => (
            <Reveal key={v.label} delay={i * 70}>
              <div
                className="relative flex h-full flex-col justify-between overflow-hidden rounded-[var(--r-lg)] p-7"
                style={{ background: POPS[i], color: FG[i] }}
              >
                {/* the plate's own ghost numeral, bled off the corner */}
                <span
                  aria-hidden
                  className="d-wide pointer-events-none absolute -right-3 -top-6 text-[7rem] leading-none opacity-15"
                >
                  {v.value}
                </span>
                <p className="d-wide relative text-[3.5rem] leading-none">{v.value}</p>
                <div className="relative mt-5">
                  <p className="label">{v.label}</p>
                  <p className="serif-it mt-1 text-[0.95rem] opacity-75">{v.note}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
