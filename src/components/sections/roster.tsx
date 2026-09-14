import { Container, Label } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import { ASSOCIATES, BOARD, FACULTY, VERTICALS } from "@/lib/data/committee";

const POPS = ["var(--azure)", "var(--violet)", "var(--lime)", "var(--pink)"];

/**
 * The full roster.
 *
 * Every name from the committee sheet, grouped exactly the way the sheet
 * groups them. No photographs, bios or titles are invented to fill the cards
 * out: names and verticals are what was supplied, so names and verticals are
 * what this renders.
 */
export function Roster() {
  return (
    <section className="bg-cream pb-24 pt-4">
      <Container>
        <div className="grid gap-3">
          <Reveal>
            <div className="card p-7 sm:p-9">
              <Label>Faculty leadership</Label>
              <ul className="mt-5 grid gap-3 sm:grid-cols-3">
                {FACULTY.map((p) => (
                  <li key={p.name} className="rounded-[var(--r-md)] bg-cream px-5 py-4">
                    <p className="d-tall text-[1.25rem] leading-tight text-ink">{p.name}</p>
                    <p className="label-sm mt-2 text-muted">{p.role}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={60}>
            <div className="card p-7 sm:p-9">
              <Label>Board of executives</Label>
              <ul className="mt-5 flex flex-wrap gap-2">
                {BOARD.map((name) => (
                  <li
                    key={name}
                    className="rounded-full bg-cream px-4 py-2.5 text-[0.875rem] font-semibold text-ink"
                  >
                    {name}
                  </li>
                ))}
              </ul>

              <div className="mt-8 border-t border-ink/10 pt-7">
                <Label>Associate executives</Label>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {ASSOCIATES.map((name) => (
                    <li
                      key={name}
                      className="rounded-full bg-cream px-4 py-2.5 text-[0.875rem] font-semibold text-ink"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>

          <div className="grid gap-3 lg:grid-cols-2">
            {VERTICALS.map((v, i) => (
              <Reveal key={v.id} delay={100 + i * 60}>
                <div className="card h-full p-7 sm:p-9">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="d-tall text-[1.9rem] leading-tight text-ink">{v.name}</h2>
                      <p className="jp mt-1 text-sm text-muted">{v.jp}</p>
                    </div>
                    <span className="d-wide text-[2.4rem] leading-none text-ink/12">
                      {v.index}
                    </span>
                  </div>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink/70">{v.remit}</p>
                  <ul
                    className="mt-6 grid gap-2 border-t-2 pt-6 sm:grid-cols-2"
                    style={{ borderColor: POPS[i] }}
                  >
                    {v.members.map((m) => (
                      <li key={m} className="text-[0.9rem] leading-snug text-ink/80">
                        {m}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
