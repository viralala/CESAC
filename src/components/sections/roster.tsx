import { Container, Label } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import type { RosterGroup } from "@/lib/data/site";

/** The four vertical accents, named so the console can pick one by name. */
const POPS: Record<string, { bg: string; fg: string }> = {
  azure: { bg: "var(--azure)", fg: "var(--ink)" },
  violet: { bg: "var(--violet)", fg: "var(--white)" },
  lime: { bg: "var(--lime)", fg: "var(--ink)" },
  pink: { bg: "var(--pink)", fg: "var(--white)" },
};

const FALLBACK_ORDER = ["azure", "violet", "lime", "pink"];

/**
 * The full roster.
 *
 * Every name from the committee sheet, grouped exactly the way the sheet
 * groups them. No photographs, bios or titles are invented to fill the cards
 * out: names and verticals are what was supplied, so names and verticals are
 * what this renders.
 *
 * Inside a vertical everyone carries a rank, and both are labelled, because a
 * tag on only half a list reads as "these people matter and these do not".
 *
 * The rows come from the database now rather than from a constant in the
 * source, so a title can be corrected from the console without a deploy. The
 * constants are still in lib/data/committee.ts and are still what renders if
 * the database cannot be reached; getRoster() decides between them.
 */
export function Roster({ groups }: { groups: RosterGroup[] }) {
  return (
    <section className="bg-cream pb-24 pt-4">
      <Container>
        <div className="grid gap-3">
          {groups
            .filter((g) => g.kind !== "vertical")
            .map((group, i) => (
              <Reveal key={group.id} delay={i * 30}>
                <div className="card p-7 sm:p-9">
                  <Label>{group.title}</Label>

                  {group.kind === "names" ? (
                    <ul className="mt-5 flex flex-wrap gap-2">
                      {group.people.map((person) => (
                        <li
                          key={person.id ?? person.name}
                          className="rounded-full bg-cream px-4 py-2.5 text-[0.875rem] font-semibold text-ink"
                        >
                          {person.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <ul className="mt-5 grid gap-3 sm:grid-cols-3">
                      {group.people.map((person) => (
                        <li
                          key={person.id ?? person.name}
                          className="rounded-[var(--r-md)] bg-cream px-5 py-4"
                        >
                          <p className="d-tall text-[1.25rem] leading-tight text-ink">
                            {person.name}
                          </p>
                          {person.role ? (
                            <p className="label-sm mt-2 text-muted">{person.role}</p>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Reveal>
            ))}

          <div className="grid gap-3 lg:grid-cols-2">
            {groups
              .filter((g) => g.kind === "vertical")
              .map((group, i) => {
                const pop = POPS[group.accent ?? ""] ?? POPS[FALLBACK_ORDER[i % 4]];
                return (
                  <Reveal key={group.id} delay={100 + i * 60}>
                    <div className="card h-full p-7 sm:p-9">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="d-tall text-[1.9rem] leading-tight text-ink">
                            {group.title}
                          </h2>
                          {group.jp ? (
                            <p className="jp mt-1 text-sm text-muted">{group.jp}</p>
                          ) : null}
                        </div>
                        {group.indexLabel ? (
                          <span className="d-wide text-[2.4rem] leading-none text-ink/12">
                            {group.indexLabel}
                          </span>
                        ) : null}
                      </div>

                      {group.remit ? (
                        <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink/70">
                          {group.remit}
                        </p>
                      ) : null}

                      <ul
                        className="mt-6 grid gap-2 border-t-2 pt-6 sm:grid-cols-2"
                        style={{ borderColor: pop.bg }}
                      >
                        {group.people.map((person) => {
                          const isLead = person.rank === "lead";
                          return (
                            <li
                              key={person.id ?? person.name}
                              className={`flex items-center gap-2 text-[0.9rem] leading-snug ${
                                isLead ? "font-bold text-ink" : "text-ink/80"
                              }`}
                            >
                              <span>{person.name}</span>
                              {/* Both roles are named. The lead tag is filled
                                  in the vertical's own colour and the head tag
                                  is only an outline, so the two read as a rank
                                  rather than as two unrelated badges. */}
                              {person.rank === null ? null : isLead ? (
                                <span
                                  className="label-sm shrink-0 rounded-full px-2 py-0.5 text-[0.55rem]"
                                  style={{ background: pop.bg, color: pop.fg }}
                                >
                                  Lead
                                </span>
                              ) : (
                                <span className="label-sm shrink-0 rounded-full border border-ink/20 px-2 py-0.5 text-[0.55rem] text-muted">
                                  Head
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </Reveal>
                );
              })}
          </div>
        </div>
      </Container>
    </section>
  );
}
