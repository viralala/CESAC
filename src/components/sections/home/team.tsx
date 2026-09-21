import Link from "next/link";

import { Arrow, Container, Label, SectionHead } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import { getRoster, rosterTotal, type RosterGroup } from "@/lib/data/site";

const POPS = ["var(--azure)", "var(--violet)", "var(--lime)", "var(--pink)"];

/** One block by id, or an empty one, so a deleted block renders nothing. */
function block(groups: RosterGroup[], id: string): RosterGroup["people"] {
  return groups.find((g) => g.id === id)?.people ?? [];
}

/**
 * The team, in preview.
 *
 * Faculty and the board are named here because they are the answer to "who is
 * accountable for this". The 38-name roster is a page of its own, linked at the
 * bottom, rather than four screens of scrolling on the way to the events.
 */
export async function HomeTeam() {
  const groups = await getRoster();

  const faculty = block(groups, "faculty");
  const studentLeadership = block(groups, "student-leadership");
  const board = block(groups, "board");
  const verticals = groups.filter((g) => g.kind === "vertical");

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
                {faculty.map((p) => (
                  <li
                    key={p.id ?? p.name}
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
                  {studentLeadership.map((p) => (
                    <li
                      key={p.id ?? p.name}
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
                {board.map((person) => (
                  <li
                    key={person.id ?? person.name}
                    className="rounded-full bg-cream px-4 py-2 text-[0.8125rem] font-semibold text-ink"
                  >
                    {person.name}
                  </li>
                ))}
              </ul>

              <div className="mt-8 grid gap-x-6 gap-y-4 border-t border-ink/10 pt-7 sm:grid-cols-2">
                {verticals.map((v, i) => (
                  <div key={v.id} className="border-t-2 pt-3" style={{ borderColor: POPS[i] }}>
                    <h3 className="d-tall text-[1.05rem] leading-tight text-ink">{v.title}</h3>
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
              <span className="d-tall text-[1.6rem] text-ink">
                All {rosterTotal(groups)} members
              </span>
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
