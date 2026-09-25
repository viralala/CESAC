import Link from "next/link";

import { Container, Label } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import { Avatar } from "@/components/site/avatar";
import type { RosterGroup, RosterPerson } from "@/lib/data/site";

/** The four vertical accents, named so the console can pick one by name. */
export const POPS: Record<string, { bg: string; fg: string }> = {
  azure: { bg: "var(--azure)", fg: "var(--on-pop)" },
  violet: { bg: "var(--violet)", fg: "var(--on-pop-light)" },
  lime: { bg: "var(--lime)", fg: "var(--on-pop)" },
  pink: { bg: "var(--pink)", fg: "var(--on-pop-light)" },
};

/** Where a name on the roster goes. */
function href(person: RosterPerson): string {
  return `/people/${person.slug}`;
}

function Face({ person, size }: { person: RosterPerson; size: number }) {
  return (
    <Avatar key={person.photos.join("|")} name={person.name} sources={person.photos} size={size} />
  );
}

export const FALLBACK_ORDER = ["azure", "violet", "lime", "pink"];

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
 *
 * Every name is a link to that person's own page since 25 September, which
 * carries what they wrote about themselves on the committee's form. The page
 * is the record the roster keeps of who worked on the committee, so it exists
 * for everybody on it, including the people who left the form blank.
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
                        <li key={person.id ?? person.name}>
                          <Link
                            href={href(person)}
                            className="inline-flex items-center gap-2.5 rounded-full bg-cream py-1.5 pl-1.5 pr-4 text-[0.875rem] font-semibold text-ink transition-colors hover:bg-cream-3"
                          >
                            <Face person={person} size={30} />
                            {person.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <ul className="mt-5 grid gap-3 sm:grid-cols-3">
                      {group.people.map((person) => (
                        <li key={person.id ?? person.name}>
                          <Link
                            href={href(person)}
                            className="flex h-full items-center gap-4 rounded-[var(--r-md)] bg-cream px-5 py-4 transition-colors hover:bg-cream-3"
                          >
                            <Face person={person} size={48} />
                            <span className="min-w-0">
                              <span className="d-tall block text-[1.25rem] leading-tight text-ink">
                                {person.name}
                              </span>
                              {person.role ? (
                                <span className="label-sm mt-2 block text-muted">{person.role}</span>
                              ) : null}
                            </span>
                          </Link>
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
                            <li key={person.id ?? person.name}>
                              <Link
                                href={href(person)}
                                className={`-mx-2 flex items-center gap-2.5 rounded-full px-2 py-1 text-[0.9rem] leading-snug transition-colors hover:bg-cream ${
                                  isLead ? "font-bold text-ink" : "text-ink/80"
                                }`}
                              >
                                <Face person={person} size={32} />
                                <span className="min-w-0">{person.name}</span>
                                {/* Both roles are named. The lead tag is filled
                                    in the vertical's own colour and the head
                                    tag is only an outline, so the two read as
                                    a rank rather than as two unrelated badges. */}
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
                              </Link>
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
