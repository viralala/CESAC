import type { Metadata } from "next";
import Link from "next/link";

import { Container, Label } from "@/components/aot/bits";
import { Chip, Empty, Notice, Panel, Stat, Tile, type TileTone } from "@/components/console/shell";
import { requireAdmin } from "@/lib/auth/guard";
import { CAP_LABEL, getMyCaps } from "@/lib/auth/caps";
import { LEVEL_LABEL } from "@/lib/console/records";
import { stamp } from "@/lib/console/record-view";
import {
  getAuditLog,
  getConsoleSnapshot,
  getSettings,
  getTopOfBoard,
} from "@/lib/data/console";
import { getDeptEvents } from "@/lib/data/dept-events";
import { METRIC_LABEL, getScale, getShowcase, metricUnit } from "@/lib/data/site";
import { CESAC } from "@/lib/data/cesac";

export const metadata: Metadata = {
  title: "Command",
  robots: { index: false, follow: false },
};

/**
 * Every place the console can go, and what it is for.
 *
 * A list rather than markup, because which of these an organiser sees depends
 * on what they hold and the filter should be one line. `cap: null` is on for
 * anybody who can open the console at all.
 */
type Destination = {
  href: string;
  cap: string | null;
  eyebrow: string;
  title: string;
  blurb: string;
  tone: TileTone;
};

const DESTINATIONS: readonly Destination[] = [
  {
    href: "/admin/certificates",
    cap: "records",
    eyebrow: "The work",
    title: "Student records",
    blurb:
      "Every certificate, paper, book and chapter students have filed. Check them, turn one down, delete a duplicate, export the lot for the office workbook.",
    tone: "teal",
  },
  {
    href: "/admin/students",
    cap: "people",
    eyebrow: "The department",
    title: "Students",
    blurb:
      "The whole roll, searchable by name, class or PRN. Who has signed in, who is still on their first password, and what each one has filed.",
    tone: "azure",
  },
  {
    href: "/admin/queries",
    cap: "queries",
    eyebrow: "Asked of us",
    title: "Questions",
    blurb: "What students have asked from their own console, and the answer they get back.",
    tone: "violet",
  },
  {
    href: "/admin/site",
    cap: "content",
    eyebrow: "The public pages",
    title: "Site content",
    blurb:
      "The words on the front page, the roster and its titles, the points scale, and who the front page names. Nothing here needs a deploy.",
    tone: "lime",
  },
  {
    href: "/admin/access",
    cap: "people",
    eyebrow: "Who can do what",
    title: "Access",
    blurb:
      "Organisers and what each one can reach, the verifiers who check records, and the allowlist that makes somebody an organiser the moment they sign in.",
    tone: "pink",
  },
  {
    href: "/admin/controls",
    cap: "settings",
    eyebrow: "Switches",
    title: "Event controls",
    blurb:
      "Registration, the published leaderboard, the front page showcase, the seat cap, the fee, the UPI details, the announcement, and the chapter run of show.",
    tone: "ink",
  },
  {
    href: "/admin/entries",
    cap: "events",
    eyebrow: "Event day",
    title: "Entries",
    blurb: "Who has entered which department event, and the fee against each entry.",
    tone: "teal",
  },
  {
    href: "/admin/teams",
    cap: "events",
    eyebrow: "Event day",
    title: "Teams and payments",
    blurb: "Attack on Token teams, their seats, and the payments waiting on a check.",
    tone: "azure",
  },
  {
    href: "/admin/events",
    cap: "events",
    eyebrow: "Event day",
    title: "Event system",
    blurb: "Open and close department events, edit what the public page says about each one.",
    tone: "violet",
  },
];

/** The number printed on each card, where there is one worth printing. */
function tileValue(
  href: string,
  s: Awaited<ReturnType<typeof getConsoleSnapshot>>,
): { value?: number | string; note?: string } {
  switch (href) {
    case "/admin/certificates":
      return { value: s.waiting, note: s.waiting === 1 ? "to check" : "to check" };
    case "/admin/students":
      return { value: s.students, note: "on the roll" };
    case "/admin/queries":
      return { value: s.openQuestions, note: "open" };
    case "/admin/site":
      return { value: s.rosterPeople, note: "on the roster" };
    case "/admin/access":
      return { value: s.organisers + s.verifiers, note: "with a login" };
    case "/admin/entries":
      return { value: s.entries, note: "entries" };
    case "/admin/teams":
      return { value: s.teams, note: "teams" };
    case "/admin/events":
      return { value: s.deptEvents, note: "events" };
    default:
      return {};
  }
}

/**
 * The command page.
 *
 * It used to be the controls themselves: five panels of switches, the chapter
 * cuts, the organiser list and the audit log, all stacked on the page an
 * organiser lands on. That is the wrong shape for a landing. Somebody opening
 * the console wants to go somewhere, and wants to know how the department is
 * doing on the way past.
 *
 * So it is two halves now. The board at the top is where to go, with the
 * number behind each card so the reason to click is on the card. Everything
 * under it is the state of the site, read at request time: the scale that
 * scores the board, who the front page is naming, what the events are doing,
 * and the last few things anybody changed. The switches moved to
 * /admin/controls and the organiser list to /admin/access, both of which are
 * cards on the board.
 *
 * Every number here is counted from the database on this request. Where a
 * thing has not happened yet the panel says so, rather than showing a zero
 * dressed up as a result.
 */
export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  const viewer = await requireAdmin();

  const [snapshot, settings, scale, showcase, events, audit, board, caps, params] =
    await Promise.all([
      getConsoleSnapshot(),
      getSettings(),
      getScale(),
      getShowcase(),
      getDeptEvents(),
      getAuditLog(8),
      getTopOfBoard(8),
      getMyCaps(),
      searchParams,
    ]);

  const open = DESTINATIONS.filter((d) => d.cap === null || caps.includes(d.cap));

  // Set by requireCap when somebody follows a link to a page they hold
  // nothing on. Named rather than generic, so they can ask for the right thing.
  const denied = typeof params.denied === "string" ? params.denied : null;

  const base = scale.filter((row) => row.band !== "level");
  const levels = scale.filter((row) => row.band === "level");

  const hour = new Date().toLocaleString("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" });
  const greeting = Number(hour) < 12 ? "Morning" : Number(hour) < 17 ? "Afternoon" : "Evening";

  return (
    <div className="washi grain min-h-[100svh] py-12 sm:py-16">
      <Container>
        <header className="max-w-[52ch]">
          <Label tone="teal">{CESAC.abbr} · {CESAC.department}</Label>
          <h1 className="d-tall mt-4 text-[clamp(2.6rem,7vw,4.5rem)] leading-[0.95] text-ink">
            {greeting}, {viewer.name.split(" ")[0]}
          </h1>
          <p className="serif-it mt-4 text-[1.1rem] leading-relaxed text-muted">
            Everything on this page is live. Pick where you are going, or read down for how the
            department is doing.
          </p>
        </header>

        {denied ? (
          <div className="mt-8">
            <Notice tone="error">
              {CAP_LABEL[denied] ?? denied} is not one of your areas, so that page sent you back
              here. Ask whoever set up the committee&rsquo;s access to add it.
            </Notice>
          </div>
        ) : null}

        {snapshot.waiting > 0 ? (
          <div className="mt-8">
            <Notice tone="ok">
              {snapshot.waiting === 1
                ? "One record is waiting on a check."
                : `${snapshot.waiting} records are waiting on a check.`}{" "}
              {snapshot.verifiers > 0
                ? `${snapshot.verifiers === 1 ? "The verifier works" : `The ${snapshot.verifiers} verifiers work`} the same queue at /verify, and the questions desk with it.`
                : "Nobody holds a verifier login yet. Add one under Access and they get a console with the records queue and the questions desk on it, and nothing else."}
            </Notice>
          </div>
        ) : null}

        {!settings.registration_open ? (
          <div className="mt-4">
            <Notice tone="error">
              Registration is closed. Nobody can make a team, though anyone can still make an
              account. Open it under Event controls when you are ready to take sign-ups.
            </Notice>
          </div>
        ) : null}

        {/* ------------------------------------------------------- where to go */}
        <section className="mt-10">
          <h2 className="label text-muted">Go to</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {open.map((d) => {
              const { value, note } = tileValue(d.href, snapshot);
              return (
                <Tile
                  key={d.href}
                  href={d.href}
                  eyebrow={d.eyebrow}
                  title={d.title}
                  blurb={d.blurb}
                  value={value}
                  note={note}
                  tone={d.tone}
                />
              );
            })}
          </div>
          {open.length === 0 ? (
            <Empty>
              Your account holds none of the console&rsquo;s areas, so there is nothing here to
              open. Ask whoever set the committee up to give you one.
            </Empty>
          ) : null}
        </section>

        {/* -------------------------------------------------------- the numbers */}
        <section className="mt-12">
          <h2 className="label text-muted">The department, right now</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Stat value={snapshot.students} label="Students" note="Accounts on the roll" />
            <Stat value={snapshot.records} label="Records" note="Filed by students" />
            <Stat value={snapshot.waiting} label="To check" note="Waiting on somebody" />
            <Stat value={snapshot.verified} label="Verified" note="Checked and agreed" />
            <Stat value={snapshot.withFile} label="With proof" note="Carrying a file" />
            <Stat value={snapshot.rosterPeople} label="Committee" note="On the public roster" />
          </div>
        </section>

        {/* --------------------------------------------------------- the details */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Panel
            eyebrow="Scoring"
            title="What a record is worth"
            aside={caps.includes("content") ? <Link href="/admin/site/points" className="hover:text-teal">Edit</Link> : undefined}
          >
            {scale.length ? (
              <>
                <p className="serif-it text-[0.98rem] leading-relaxed text-muted">
                  A record scores its base plus its level. Change a number and the whole
                  department is scored again on the next request; nothing is stored against a row.
                </p>

                <div className="mt-5 grid gap-x-8 gap-y-1 sm:grid-cols-2">
                  <div>
                    <p className="label-sm text-teal">Base</p>
                    <dl className="mt-2">
                      {base.map((row) => (
                        <div
                          key={row.key}
                          className="flex items-baseline justify-between gap-4 border-b border-ink/10 py-2 last:border-0"
                        >
                          <dt className="text-[0.95rem] text-ink">{row.label}</dt>
                          <dd className="d-tall text-[1.15rem] text-ink">{row.points}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  <div>
                    <p className="label-sm text-teal">Level, added on top</p>
                    <dl className="mt-2">
                      {levels.map((row) => (
                        <div
                          key={row.key}
                          className="flex items-baseline justify-between gap-4 border-b border-ink/10 py-2 last:border-0"
                        >
                          <dt className="text-[0.95rem] text-ink">
                            {LEVEL_LABEL[row.key.replace("level:", "")] ?? row.label}
                          </dt>
                          <dd className="d-tall text-[1.15rem] text-ink">+{row.points}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              </>
            ) : (
              <Empty>
                The scale could not be read. Nothing is printed from a constant here on purpose: a
                scale shown from code while the database scores from a table is a console that
                lies about a student&rsquo;s own total.
              </Empty>
            )}
          </Panel>

          <Panel
            eyebrow="The front page"
            title="Standouts"
            aside={
              settings.showcase_public ? (
                <Chip tone="lime">Showing</Chip>
              ) : (
                <Chip tone="muted">Switched off</Chip>
              )
            }
          >
            {showcase.length ? (
              <ul className="grid gap-5">
                {showcase.map((category) => (
                  <li key={category.id}>
                    <p className="label text-ink">{category.title}</p>
                    <p className="label-sm mt-0.5 text-muted">
                      {METRIC_LABEL[category.metric] ?? category.metric}
                    </p>
                    {category.entries.length ? (
                      <ol className="mt-2 grid gap-1">
                        {category.entries.map((entry) => (
                          <li
                            key={entry.studentId}
                            className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-ink/10 py-2 last:border-0"
                          >
                            <span className="text-[0.95rem] text-ink">
                              <span className="label-sm mr-2 text-muted">{entry.place}</span>
                              {entry.name}
                              {entry.year ? (
                                <span className="label-sm ml-2 text-muted">{entry.year}</span>
                              ) : null}
                            </span>
                            <span className="label-sm text-muted">
                              {category.metric === "manual"
                                ? (entry.note ?? "Named by the committee")
                                : `${entry.value} ${metricUnit(category.metric)}`}
                            </span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="serif-it mt-2 text-[0.9rem] text-muted">
                        Nothing in it yet. A ranked category fills itself as students upload; a
                        chosen one waits for you to name somebody.
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>
                No category is set up. Make one under Site content and the front page starts
                naming students; until then that band does not render at all.
              </Empty>
            )}
          </Panel>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <Panel
            eyebrow="Ranking"
            title="Top of the board"
            aside={`${snapshot.records} ${snapshot.records === 1 ? "record" : "records"} in all`}
          >
            {board.length ? (
              <ol className="grid">
                {board.map((row) => (
                  <li
                    key={row.student_id}
                    className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-ink/10 py-3 last:border-0"
                  >
                    <span className="flex min-w-0 items-baseline gap-3">
                      <span className="d-tall w-6 shrink-0 text-[1.1rem] text-muted">
                        {row.place}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[1rem] text-ink">{row.name}</span>
                        <span className="label-sm block text-muted">
                          {[row.year, `${row.certificates} ${row.certificates === 1 ? "record" : "records"}`]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                    </span>
                    <span className="d-tall text-[1.25rem] text-ink">{row.points}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <Empty>
                Nobody is on the board. It fills as students file records, and a student with
                nothing filed is left off it rather than listed on nought.
              </Empty>
            )}
          </Panel>

          <Panel eyebrow="Running" title="Events" aside={`${snapshot.entries} entries`}>
            {events.length ? (
              <ul className="grid gap-3">
                {events.map((event) => (
                  <li
                    key={event.slug}
                    className="rounded-[var(--r-md)] bg-cream-2 px-5 py-4"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <span className="label text-ink">{event.name}</span>
                      <Chip
                        tone={
                          event.state === "open" ? "lime" : event.state === "closed" ? "ink" : "muted"
                        }
                      >
                        {event.state}
                      </Chip>
                    </div>
                    <p className="label-sm mt-1 text-muted">
                      {[
                        event.when_label,
                        event.fee_inr ? `₹${event.fee_inr}` : "Free",
                        event.team_size ? `Teams of ${event.team_size}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>
                No department event is set up. Add one under Event system and it appears on the
                public events page.
              </Empty>
            )}
          </Panel>
        </div>

        <div className="mt-6">
          <Panel eyebrow="Record" title="Recent actions">
            {audit.length ? (
              <ul className="grid">
                {audit.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-ink/10 py-3 last:border-0"
                  >
                    <span className="font-mono text-[0.85rem] text-ink">{entry.action}</span>
                    <span className="label-sm text-muted">{stamp(entry.created_at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>
                Nothing has happened yet. Every record verified, payment checked, chapter opened,
                score set and cut applied is written here with who did it, so a disputed decision
                has a record.
              </Empty>
            )}
          </Panel>
        </div>
      </Container>
    </div>
  );
}
