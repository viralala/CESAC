import { Container } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import { HR_VITALS } from "@/lib/data/hr-final-boss";

const POPS = ["var(--hb-azure)", "var(--hb-maya)", "var(--hb-ink)", "var(--hb-azure-deep)"];
const FG = ["#ffffff", "var(--hb-ink)", "var(--hb-ghost)", "#ffffff"];

/** The four numbers that answer "can I come" before anything else does. */
export function HrfbVitals() {
  return (
    <section className="grid-box py-14 sm:py-20">
      <Container>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {HR_VITALS.map((v, i) => (
            <Reveal key={v.label} delay={i * 70}>
              <div
                className="relative flex h-full flex-col justify-between overflow-hidden rounded-[var(--r-lg)] p-7"
                style={{ background: POPS[i], color: FG[i] }}
              >
                <span
                  aria-hidden
                  className="hb-display pointer-events-none absolute -right-3 -top-6 text-[6.5rem] leading-none opacity-15"
                >
                  {v.value}
                </span>
                <p className="hb-display relative text-[2.75rem] leading-none">{v.value}</p>
                <div className="relative mt-5">
                  <p className="label">{v.label}</p>
                  <p className="hb-cursive mt-1 text-[0.95rem] opacity-80">{v.note}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
