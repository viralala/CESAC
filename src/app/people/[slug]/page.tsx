import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container, Label } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import { FALLBACK_ORDER, POPS } from "@/components/sections/roster";
import { FacultyProfile } from "@/components/sections/faculty-profile";
import { Avatar } from "@/components/site/avatar";
import { SiteFooter } from "@/components/site/footer";
import { SocialMark, type SocialId } from "@/components/site/social-mark";
import { getRoster, getRosterPerson, type RosterGroup, type RosterPerson } from "@/lib/data/site";

export async function generateMetadata(props: PageProps<"/people/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const found = await getRosterPerson(slug);
  if (!found) return { title: "Not on the roster" };

  const { person, group } = found;
  return {
    title: person.name,
    description:
      person.profile.tagline ??
      `${person.name}, ${person.role ?? group.title}, on the CESAC committee at VIT Pune.`,
    alternates: { canonical: `/people/${person.slug}` },
  };
}

/** The rank or title under the name, in the words the roster already uses. */
function standing(person: RosterPerson, group: RosterGroup): string {
  const rank = person.rank === "lead" ? "Lead" : person.rank === "head" ? "Head" : null;
  if (group.kind === "vertical") return [group.title, rank].filter(Boolean).join(" · ");
  return person.role ?? group.title;
}

function firstName(person: RosterPerson): string {
  const preferred = person.profile.preferredName?.split("/")[0]?.trim();
  if (preferred) return preferred.split(/\s+/)[0];
  return person.name.replace(/^(dr|prof)\.?\s+/i, "").split(/\s+/)[0];
}

const SOCIALS: { id: SocialId; label: string; key: "instagram" | "linkedin" | "github" }[] = [
  { id: "instagram", label: "Instagram", key: "instagram" },
  { id: "linkedin", label: "LinkedIn", key: "linkedin" },
  { id: "github", label: "GitHub", key: "github" },
];

/**
 * One person on the committee, in their own words.
 *
 * Everything under the name was written by them, on the committee's form, and
 * is printed as they wrote it: no bios are invented to fill a thin page, and a
 * section they left blank is left out rather than padded. The page exists for
 * everybody on the roster whether they filled the form in or not, because the
 * point of it is also the record: who was on the committee, doing what.
 *
 * What is deliberately not here, although the form asked for both: a phone
 * number and an email address. The roster is a public page.
 *
 * Faculty are the exception on both counts, by the committee's request on
 * 27 September 2026: their pages carry the long profile the Institute itself
 * publishes, including the institute email address it prints there, from
 * roster_people.details. The personal phone number on that same source is
 * still left out.
 */
export default async function PersonPage(props: PageProps<"/people/[slug]">) {
  const { slug } = await props.params;
  const found = await getRosterPerson(slug);
  if (!found) notFound();

  const { person, group } = found;
  const { profile } = person;
  const groups = await getRoster();
  const verticalIndex = groups.filter((g) => g.kind === "vertical").findIndex((g) => g.id === group.id);
  const pop =
    POPS[group.accent ?? ""] ??
    POPS[FALLBACK_ORDER[Math.max(0, verticalIndex) % FALLBACK_ORDER.length]];

  const socials = SOCIALS.filter((s) => profile[s.key]);
  const facts = [
    profile.hobbies ? { title: "Hobbies and interests", body: profile.hobbies } : null,
    profile.funFact ? { title: "Fun fact, or a hidden skill", body: profile.funFact } : null,
  ].filter((f): f is { title: string; body: string } => f !== null);
  const wroteSomething = Boolean(profile.about || profile.tagline || facts.length);
  const others = group.people.filter((p) => p.slug !== person.slug);
  const faculty = profile.details ?? null;

  return (
    <>
      <header className="washi grain relative overflow-hidden pb-14 pt-28 sm:pb-20 sm:pt-36">
        <Container className="relative">
          <Link href="/people" className="label inline-flex items-center gap-2 text-teal hover:text-ink">
            <span aria-hidden>←</span> The roster
          </Link>

          <div className="mt-8 grid items-end gap-8 md:grid-cols-[auto_1fr] md:gap-12">
            <div className="relative justify-self-start">
              <span
                aria-hidden
                className="absolute -inset-2 rounded-[calc(var(--r-xl)+8px)] opacity-80"
                style={{ background: pop.bg }}
              />
              <Avatar
                key={person.photos.join("|")}
                name={person.name}
                sources={person.photos}
                size={220}
                shape="tile"
                priority
                className="shadow-[var(--sh-3)]"
              />
            </div>

            <div className="min-w-0">
              <Label tone="teal">{standing(person, group)}</Label>
              <h1 className="d-tall mt-4 text-[clamp(2.6rem,8vw,5.6rem)] text-ink">{person.name}</h1>
              {group.jp ? <p className="jp mt-2 text-[1.1rem] text-muted">{group.jp}</p> : null}

              {faculty?.full_name && faculty.full_name !== person.name ? (
                <p className="serif-it mt-3 text-[1.1rem] text-muted">
                  <span className="text-ink">{faculty.full_name}</span> on the Institute&apos;s record
                </p>
              ) : null}

              {faculty?.designation ? (
                <p className="mt-4 text-[1.1rem] leading-snug text-ink/85">
                  {[faculty.designation, faculty.department, faculty.institute]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              ) : null}

              {profile.preferredName ? (
                <p className="serif-it mt-3 text-[1.1rem] text-muted">
                  Goes by <span className="text-ink">{profile.preferredName}</span>
                </p>
              ) : null}

              {profile.tagline ? (
                <p className="serif-it mt-5 max-w-[46ch] text-left text-[clamp(1.2rem,2.4vw,1.6rem)] leading-snug text-ink">
                  {profile.tagline}
                </p>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-2">
                {profile.yearBranch ? (
                  <span className="label-sm rounded-full bg-white px-3.5 py-2 text-ink">
                    {profile.yearBranch}
                  </span>
                ) : null}
                {profile.tenure ? (
                  <span className="label-sm rounded-full bg-white px-3.5 py-2 text-ink">
                    {profile.tenure}
                  </span>
                ) : null}
                {faculty?.email ? (
                  <a
                    href={`mailto:${faculty.email}`}
                    className="label-sm inline-flex items-center gap-2 rounded-full border-2 border-ink/15 px-3.5 py-1.5 text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cream"
                  >
                    {faculty.email}
                  </a>
                ) : null}
                {socials.map((s) => (
                  <a
                    key={s.id}
                    href={profile[s.key]!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="label-sm inline-flex items-center gap-2 rounded-full border-2 border-ink/15 px-3.5 py-1.5 text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cream"
                  >
                    <SocialMark id={s.id} />
                    {s.label}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </header>

      <section className="bg-cream pb-20 pt-4 sm:pb-24">
        <Container>
          {faculty ? (
            <div className="mb-3">
              <FacultyProfile details={faculty} />
            </div>
          ) : null}

          <div className={`grid gap-3 ${faculty && !profile.about ? "" : "lg:grid-cols-[1.5fr_1fr]"}`}>
            {faculty && !profile.about ? null : (
            <Reveal>
              <article className="card h-full p-7 sm:p-9">
                <Label tone="teal">About</Label>
                {profile.about ? (
                  <p className="mt-5 whitespace-pre-line text-[1.05rem] leading-relaxed text-ink/85">
                    {profile.about}
                  </p>
                ) : (
                  <p className="serif-it mt-5 text-[1.02rem] leading-relaxed text-muted">
                    {wroteSomething
                      ? `${firstName(person)} kept the rest short.`
                      : `${firstName(person)} has not written anything for this page yet. It fills in from the committee's roster form, and the committee can add to it from the console.`}
                  </p>
                )}
              </article>
            </Reveal>
            )}

            <div className="grid content-start gap-3">
              {facts.map((fact, i) => (
                <Reveal key={fact.title} delay={60 + i * 60}>
                  <article className="card p-7">
                    <Label tone="teal">{fact.title}</Label>
                    <p className="mt-4 text-[1rem] leading-relaxed text-ink/85">{fact.body}</p>
                  </article>
                </Reveal>
              ))}

              <Reveal delay={180}>
                <article className="card p-7">
                  <Label tone="teal">On the committee</Label>
                  <p className="d-tall mt-4 text-[1.5rem] leading-tight text-ink">{group.title}</p>
                  {group.remit ? (
                    <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{group.remit}</p>
                  ) : null}
                  {person.rank || person.role ? (
                    <span
                      className="label-sm mt-4 inline-flex rounded-full px-3 py-1.5"
                      style={{ background: pop.bg, color: pop.fg }}
                    >
                      {person.rank === "lead" ? "Lead" : person.rank === "head" ? "Head" : person.role}
                    </span>
                  ) : null}
                </article>
              </Reveal>
            </div>
          </div>

          {others.length ? (
            <Reveal className="mt-3">
              <div className="card p-7 sm:p-9">
                <Label tone="teal">Also in {group.title}</Label>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {others.map((other) => (
                    <li key={other.slug}>
                      <Link
                        href={`/people/${other.slug}`}
                        className="inline-flex items-center gap-2.5 rounded-full bg-cream py-1.5 pl-1.5 pr-4 text-[0.875rem] font-semibold text-ink transition-colors hover:bg-cream-3"
                      >
                        <Avatar
                          key={other.photos.join("|")}
                          name={other.name}
                          sources={other.photos}
                          size={30}
                        />
                        {other.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ) : null}
        </Container>
      </section>

      <SiteFooter />
    </>
  );
}
