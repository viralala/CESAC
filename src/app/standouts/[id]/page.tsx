import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Container, Label } from "@/components/aot/bits";
import { Reveal } from "@/components/aot/reveal";
import { Chip } from "@/components/console/shell";
import { Avatar } from "@/components/site/avatar";
import { SiteFooter } from "@/components/site/footer";
import { CONTRIBUTION_LABEL } from "@/lib/console/options";
import {
  KIND_LABEL,
  LAYOUT,
  LAYOUT_GROUPS,
  LEVEL_LABEL,
  isPlaced,
  type Kind,
} from "@/lib/console/records";
import { getSettings } from "@/lib/data/console";
import { getStandoutProfile, type PublicRecord } from "@/lib/data/standout";

export async function generateMetadata(props: PageProps<"/standouts/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const profile = await getStandoutProfile(id);
  if (!profile) return { title: "Not on the standouts" };
  return {
    title: profile.name,
    description: `What ${profile.name} has on their record: ${profile.records} ${
      profile.records === 1 ? "record" : "records"
    }, ${profile.points} points, on the CESAC standouts at VIT Pune.`,
    alternates: { canonical: `/standouts/${profile.id}` },
  };
}

function ordinal(n: number): string {
  const rem = n % 100;
  if (rem >= 11 && rem <= 13) return `${n}th`;
  return `${n}${({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th"}`;
}

function onDay(date: string | null): string | null {
  if (!date) return null;
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

/** When it was, in as few words as the record allows. */
function period(item: PublicRecord): string | null {
  const start = onDay(item.happened_on);
  if (item.kind === "internship" && start) {
    return `${start} to ${onDay(item.ended_on) ?? "now"}`;
  }
  return start ?? (item.publication_year ? String(item.publication_year) : null);
}

/**
 * The facts that say what a record was, in the order a reader wants them.
 *
 * Each is only printed when the student filled it in. Nothing here is a file,
 * a link, an amount of money or a contact detail: the database function never
 * sends those, and this list could not print them if it did.
 */
function facts(item: PublicRecord): string[] {
  const out: (string | null)[] = [
    item.specialization,
    item.role && item.role !== "Participant" ? item.role : null,
    item.venue,
    item.chapter,
    item.location,
    item.mode,
    item.theme ? `Track: ${item.theme}` : null,
    item.project ? `Built: ${item.project}` : null,
    item.team_name ? `Team ${item.team_name}` : null,
    item.team_size && item.team_size > 1 ? `Team of ${item.team_size}` : null,
    item.rank,
    item.duration,
    item.score,
    item.patent_status,
    item.indexing && item.indexing !== "None" ? `Indexed in ${item.indexing}` : null,
    item.quartile,
    item.publisher,
    item.authors ? `With ${item.authors}` : null,
    item.skills,
  ];
  return out.filter((v): v is string => Boolean(v && v.trim()));
}

const PLACE_TONE: Record<string, "lime" | "teal" | "muted"> = {
  first: "lime",
  second: "teal",
  third: "teal",
  participation: "muted",
};

/**
 * One standout, and everything they have put on their record.
 *
 * The committee asked for this on 27 September 2026 so that a student reading
 * the standouts can see what the people on it have actually done, "but not
 * his certificates, just info". So it lists each record by what it is, where
 * it reached and what came of it, and never shows a certificate or any other
 * file. A record nobody has checked yet is on the board already and is shown
 * here too, marked as not yet checked, rather than hidden from the one page
 * that explains the number.
 */
export default async function StandoutProfilePage(props: PageProps<"/standouts/[id]">) {
  const { id } = await props.params;
  const [profile, settings] = await Promise.all([getStandoutProfile(id), getSettings()]);
  if (!profile || !settings.showcase_public) notFound();

  const groups = LAYOUT_GROUPS.map((group) => ({
    group,
    items: profile.items.filter((item) => (LAYOUT[item.kind]?.group ?? "Other") === group),
  })).filter((g) => g.items.length > 0);

  const podium = [
    profile.firsts ? `${profile.firsts} first` : null,
    profile.seconds ? `${profile.seconds} second` : null,
    profile.thirds ? `${profile.thirds} third` : null,
  ].filter(Boolean);

  return (
    <>
      <header className="washi grain relative overflow-hidden pb-14 pt-28 sm:pb-20 sm:pt-36">
        <Container className="relative">
          <Link
            href="/standouts"
            className="label inline-flex items-center gap-2 text-teal hover:text-ink"
          >
            <span aria-hidden>←</span> The standouts
          </Link>

          <div className="mt-8 grid items-end gap-8 md:grid-cols-[auto_1fr] md:gap-12">
            <Avatar
              key={profile.photo ?? "none"}
              name={profile.name}
              sources={[profile.photo]}
              size={200}
              shape="tile"
              priority
              className="justify-self-start shadow-[var(--sh-3)]"
            />

            <div className="min-w-0">
              <Label tone="teal">Standout{profile.year ? ` · ${profile.year}` : ""}</Label>
              <h1 className="d-tall mt-4 text-[clamp(2.4rem,7vw,5rem)] text-ink">{profile.name}</h1>

              {profile.places.length ? (
                <ul className="mt-6 flex flex-wrap gap-2">
                  {profile.places.map((p) => (
                    <li
                      key={p.category}
                      className="label-sm rounded-full bg-white px-3.5 py-2 text-ink"
                    >
                      <span className="text-teal">{ordinal(p.place)}</span> in {p.category}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </Container>
      </header>

      <section className="bg-cream pb-20 pt-4 sm:pb-24">
        <Container>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { value: profile.points, label: "Points", note: "On the department's scale" },
              {
                value: profile.records,
                label: profile.records === 1 ? "Record" : "Records",
                note: `${profile.verified} checked by the committee`,
              },
              {
                value: profile.wins,
                label: profile.wins === 1 ? "Place won" : "Places won",
                note: podium.length ? podium.join(", ") : "Hackathons, competitions and more",
              },
              {
                value: profile.publications,
                label: profile.publications === 1 ? "Publication" : "Publications",
                note: "Papers, books and chapters",
              },
            ].map((stat) => (
              <div key={stat.label} className="card px-6 py-6 text-center">
                <p className="d-tall text-[2.4rem] leading-none text-ink">{stat.value}</p>
                <p className="label mt-2.5 text-teal">{stat.label}</p>
                <p className="mt-1.5 text-center text-[0.85rem] leading-snug text-muted">{stat.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-10">
            {groups.map(({ group, items }) => (
              <section key={group}>
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="d-tall text-[1.9rem] text-ink">{group}</h2>
                  <span className="label text-muted">{items.length}</span>
                </div>

                <ul className="mt-4 grid gap-3 md:grid-cols-2">
                  {items.map((item, i) => {
                    const when = period(item);
                    const detail = facts(item);
                    return (
                      <li key={`${item.title}-${i}`}>
                        <Reveal delay={Math.min(i, 6) * 40} className="h-full">
                        <div className="card h-full p-6">
                          <p className="text-[1.08rem] leading-snug text-ink">{item.title}</p>

                          <div className="mt-3 flex flex-wrap items-center gap-1.5">
                            <Chip tone="ink">{KIND_LABEL[item.kind] ?? "Record"}</Chip>
                            {item.level && item.level !== "other" ? (
                              <Chip tone="teal">{LEVEL_LABEL[item.level] ?? item.level}</Chip>
                            ) : null}
                            {isPlaced(item.kind as Kind) ? (
                              <Chip tone={PLACE_TONE[item.contribution] ?? "muted"}>
                                {CONTRIBUTION_LABEL[item.contribution] ?? "Participation"}
                              </Chip>
                            ) : null}
                            {item.verified ? (
                              <Chip tone="lime">Checked</Chip>
                            ) : (
                              <Chip tone="muted">Not yet checked</Chip>
                            )}
                          </div>

                          {when || detail.length ? (
                            <p className="mt-3 text-left text-[0.92rem] leading-relaxed text-muted">
                              {[when, ...detail].filter(Boolean).join(" · ")}
                            </p>
                          ) : null}
                        </div>
                        </Reveal>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>

          <p className="serif-it mt-12 max-w-[70ch] text-[0.98rem] leading-relaxed text-muted">
            This lists what {profile.name.split(/\s+/)[0]} has put on their record. Certificates and
            other files stay private to them and the committee.
          </p>
        </Container>
      </section>

      <SiteFooter />
    </>
  );
}
