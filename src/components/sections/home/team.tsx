import Link from "next/link";

import { Arrow, Container, Label, SectionHead } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import {
  BOARD,
  FACULTY,
  STUDENT_LEADERSHIP,
  TEAM_TOTAL,
  VERTICALS,
} from "@/lib/data/committee";

const POPS = ["var(--azure)", "var(--violet)", "var(--lime)", "var(--pink)"];

/**
 * The team, in preview.
 *
 * Faculty and the board are named here because they are the answer to "who is
 * accountable for this". The 38-name roster is a page of its own, linked at the
 * bottom, rather than four screens of scrolling on the way to the events.
 */
export function HomeTeam() {
  return (
    <section id="team" className="scroll-mt-24 bg-cream py-20 sm:py-24">
      <Container>
        <Reveal>
          <SectionHead
            eyebrow="Who runs it"
            title="The committee"
            aside="Faculty and student leadership, a board of executives and four verticals of student members."
          />
        </Reveal>

        <div className="mt-14 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <Reveal>
            <div className="card h-full p-7">
              <Label>Faculty leadership</Label>
              <ul className="mt-5 grid gap-3">
                {FACULTY.map((p) => (
                  <li
                    key={p.name}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-[var(--r-md)] bg-cream px-5 py-4"
                  >
                    <span className="d-tall text-[1.2rem] leading-tight text-ink">{p.name}</span>
                    <span className="label-sm text-muted">{p.role}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 border-t border-ink/10 pt-7">
                <Label>Student leadership</Label>
                <ul className="mt-5 grid gap-3">
                  {STUDENT_LEADERSHIP.map((p) => (
                    <li
                      key={p.name}
                      className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-[var(--r-md)] bg-cream px-5 py-4"
                    >
                      <span className="d-tall text-[1.2rem] leading-tight text-ink">{p.name}</span>
                      <span className="label-sm text-muted">{p.role}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="card h-full p-7">
              <Label>Board of executives</Label>
              <ul className="mt-5 flex flex-wrap gap-2">
                {BOARD.map((name) => (
                  <li
                    key={name}
                    className="rounded-full bg-cream px-4 py-2 text-[0.8125rem] font-semibold text-ink"
                  >
                    {name}
                  </li>
                ))}
              </ul>

              <div className="mt-8 grid gap-x-6 gap-y-4 border-t border-ink/10 pt-7 sm:grid-cols-2">
                {VERTICALS.map((v, i) => (
                  <div key={v.id} className="border-t-2 pt-3" style={{ borderColor: POPS[i] }}>
                    <h3 className="d-tall text-[1.05rem] leading-tight text-ink">{v.name}</h3>
                    <p className="mt-1 text-[0.8125rem] leading-snug text-muted">{v.remit}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-4">
          <Link
            href="/people"
            className="group flex flex-wrap items-center justify-between gap-5 rounded-[var(--r-xl)] bg-cream-2 px-8 py-7 transition-colors hover:bg-cream-3"
          >
            <span>
              <span className="d-tall text-[1.6rem] text-ink">All {TEAM_TOTAL} members</span>
              <span className="serif-it mt-1 block text-[0.95rem] text-muted">
                Faculty, board, associates and every vertical.
              </span>
            </span>
            <span className="dot-btn">
              <Arrow />
            </span>
          </Link>
        </Reveal>
      </Container>
    </section>
  );
}
