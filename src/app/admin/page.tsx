import type { Metadata } from "next";

import { Container, Label } from "@/components/aot/bits";
import { ConsoleBar, Empty, Panel, Row } from "@/components/console/shell";
import { accountSummary } from "@/lib/auth/accounts";
import { requireAdmin } from "@/lib/auth/guard";
import { ASSOCIATES, BOARD, FACULTY, TEAM_TOTAL, VERTICALS } from "@/lib/data/committee";
import { AWARDS, CHAPTERS, EVENT, VITALS } from "@/lib/data/event";

export const metadata: Metadata = {
  title: "Organiser console",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/people", label: "Roster" },
  { href: "/events/attack-on-token", label: "Event page" },
  { href: "/", label: "Site" },
];

/**
 * The organiser console.
 *
 * Same rule as the participant side: the only figures on this page are ones
 * the build can actually count. The account tallies are read from the store at
 * request time, the roster and chapter figures are the transcribed deck, and
 * every control that needs a backend says so instead of rendering a dead
 * button next to a made-up number.
 */
export default async function AdminPage() {
  const session = await requireAdmin();
  const accounts = accountSummary();
  const demo = accounts.source === "demo";

  return (
    <>
      <ConsoleBar session={session} area="Organiser console" nav={NAV} />

      <div className="washi grain min-h-[100svh] py-12 sm:py-16">
        <Container>
          <header className="max-w-[46ch]">
            <Label tone="teal">{EVENT.host}</Label>
            <h1 className="d-tall mt-4 text-[clamp(2.6rem,7vw,4.5rem)] text-ink">Command</h1>
            <p className="serif-it mt-4 text-[1.1rem] leading-relaxed text-muted">
              Signed in as {session.name}. Everything below is read from the build. Where a
              control needs a backend that does not exist yet, it says so rather than pretending.
            </p>
          </header>

          {demo ? (
            <p
              role="status"
              className="mt-8 flex items-start gap-4 rounded-[var(--r-md)] border-2 border-red/30 bg-red/[0.06] px-6 py-5 text-[1rem] leading-relaxed text-ink"
            >
              <span aria-hidden className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-red" />
              <span>
                <strong className="font-semibold">Demo accounts are live.</strong> AOT_ACCOUNTS is
                not set, so this deployment accepts the two public logins from the README. Set it
                in the Vercel project settings before this console holds anything real.
              </span>
            </p>
          ) : null}

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.15fr]">
            <Panel
              eyebrow="Access"
              title="Account store"
              aside={demo ? "Demo fallback" : "Configured"}
            >
              <dl>
                <Row
                  k="Source"
                  v={demo ? "Built-in demo accounts" : "AOT_ACCOUNTS environment variable"}
                />
                <Row k="Participant accounts" v={accounts.participants} />
                <Row k="Organiser accounts" v={accounts.admins} />
                <Row k="Password storage" v="scrypt digest, N=16384" />
                <Row k="Session" v="Signed HS256 cookie, 7 day maximum" />
              </dl>
              <p className="serif-it mt-6 text-[0.95rem] leading-relaxed text-muted">
                Accounts are configuration, not a database. Add or revoke one by editing
                AOT_ACCOUNTS and redeploying. The README carries the JSON shape and the command
                that mints a password digest.
              </p>
            </Panel>

            <Panel eyebrow="Registration" title="Teams" aside={EVENT.dateVenue}>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {VITALS.map((vital) => (
                  <div
                    key={vital.label}
                    className="rounded-[var(--r-md)] bg-cream-2 px-5 py-5 text-center"
                  >
                    <p className="d-tall text-[2.2rem] leading-none text-ink">{vital.value}</p>
                    <p className="label mt-2.5 text-teal">{vital.label}</p>
                    <p className="mt-1.5 text-[0.85rem] leading-snug text-muted">{vital.note}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Empty>
                  These are the caps from the deck, not a count of anyone who has signed up. No
                  registration backend is connected to this site, so there is nothing to tally
                  yet. When registration lands, the filled and remaining counts belong here.
                </Empty>
              </div>
            </Panel>
          </div>

          <section className="mt-6">
            <Panel eyebrow="Run of show" title="Chapter control" aside={EVENT.tagline}>
              <ol className="grid gap-4 md:grid-cols-3">
                {CHAPTERS.map((chapter) => (
                  <li
                    key={chapter.id}
                    className="flex flex-col rounded-[var(--r-md)] border-2 border-ink/10 p-6"
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="d-tall text-[2.5rem] leading-none text-ink">
                        {chapter.numeral}
                      </span>
                      <span className="label-sm rounded-full bg-cream-2 px-3 py-1.5 text-muted">
                        {chapter.weight}%
                      </span>
                    </div>
                    <h3 className="d-tall mt-4 text-[1.3rem] text-ink">{chapter.title}</h3>
                    <p className="mt-2.5 text-[0.95rem] leading-relaxed text-muted">
                      {chapter.task}
                    </p>
                    <dl className="mt-5 border-t border-ink/10 pt-4">
                      <Row k="Collects" v={chapter.deliver} />
                      <Row k="Cut" v={`${chapter.from} to ${chapter.to}`} />
                      <Row k="Window" v={chapter.tools} />
                    </dl>
                  </li>
                ))}
              </ol>
              <div className="mt-6">
                <Empty>
                  Opening a chapter, locking Chapter II prompts and publishing a cut all need the
                  grading pipeline, which is not built. The deck describes it; nothing on this
                  site implements it yet, so there are no buttons here to press.
                </Empty>
              </div>
            </Panel>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
            <Panel eyebrow="Committee" title="Who runs it" aside={`${TEAM_TOTAL} people`}>
              <dl>
                <Row k="Faculty" v={`${FACULTY.length}`} />
                <Row k="Board of executives" v={`${BOARD.length}`} />
                <Row k="Associate executives" v={`${ASSOCIATES.length}`} />
                {VERTICALS.map((vertical) => (
                  <Row
                    key={vertical.id}
                    k={vertical.name}
                    v={`${vertical.members.length} members`}
                  />
                ))}
              </dl>
            </Panel>

            <Panel eyebrow="Prizes" title="Awards to call">
              <ul className="grid gap-3">
                {AWARDS.map((award) => (
                  <li
                    key={award.title}
                    className="flex items-center gap-4 rounded-[var(--r-md)] bg-cream-2 px-5 py-3.5"
                  >
                    <span className="d-tall w-7 shrink-0 text-[1.2rem] text-teal">
                      {award.chapter}
                    </span>
                    <span className="min-w-0">
                      <span className="label block truncate text-ink">{award.title}</span>
                      <span className="mt-1 block text-[0.85rem] text-muted">{award.note}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </Container>
      </div>
    </>
  );
}
