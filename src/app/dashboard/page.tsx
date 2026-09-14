import type { Metadata } from "next";
import Link from "next/link";

import { Container, Label } from "@/components/aot/bits";
import { ConsoleBar, Empty, Panel, Row } from "@/components/console/shell";
import { findAccountById } from "@/lib/auth/accounts";
import { requireParticipant } from "@/lib/auth/guard";
import { CHAPTERS, ENTRY, EVENT } from "@/lib/data/event";

export const metadata: Metadata = {
  title: "Your console",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/events/attack-on-token", label: "Event page" },
  { href: "/events", label: "Events" },
  { href: "/", label: "Site" },
];

/**
 * The participant console.
 *
 * Everything with a number in it comes from `@/lib/data/event`, which is the
 * deck transcribed. Nothing here shows a score, a rank or a submission count,
 * because none of those exist yet: where a real pipeline will later put data,
 * this page puts a sentence saying what has to happen first. A console that
 * opens on invented figures teaches its users to distrust the real ones.
 */
export default async function DashboardPage() {
  const session = await requireParticipant();
  const account = findAccountById(session.sub);

  return (
    <>
      <ConsoleBar session={session} area="Participant console" nav={NAV} />

      <div className="washi grain min-h-[100svh] py-12 sm:py-16">
        <Container>
          <header className="max-w-[46ch]">
            <Label tone="teal">{EVENT.kicker}</Label>
            <h1 className="d-tall mt-4 text-[clamp(2.6rem,7vw,4.5rem)] text-ink">
              {session.name}
            </h1>
            <p className="serif-it mt-4 text-[1.1rem] leading-relaxed text-muted">
              You are through the gate. Chapters open on the day, and this console fills in as
              they do.
            </p>
          </header>

          <div className="mt-12 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
            <Panel eyebrow="Your team" title="Registration" aside={EVENT.dateVenue}>
              <dl>
                <Row k="Team" v={session.name} />
                <Row k="Partner" v={account?.partner ?? "Not recorded yet"} />
                <Row k="Team ID" v={<span className="font-mono text-[0.95em]">{session.sub}</span>} />
                <Row k="Entry" v="₹200 per team of two" />
              </dl>
            </Panel>

            <Panel eyebrow="Standing" title="Leaderboard">
              <Empty>
                The live leaderboard runs during Chapter II, when every locked system prompt is
                put against the hidden adversarial tests. Your position appears here the moment
                the first test round scores.
              </Empty>
            </Panel>
          </div>

          <section className="mt-6">
            <Panel eyebrow="The run" title="Three chapters" aside={EVENT.tagline}>
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
                      <span
                        className="label-sm rounded-full px-3 py-1.5"
                        style={{
                          background: `var(--${chapter.pop})`,
                          color: chapter.pop === "lime" ? "var(--ink)" : "var(--white)",
                        }}
                      >
                        {chapter.weight}% of score
                      </span>
                    </div>
                    <h3 className="d-tall mt-4 text-[1.3rem] text-ink">{chapter.title}</h3>
                    <p className="mt-2.5 text-[0.95rem] leading-relaxed text-muted">
                      {chapter.task}
                    </p>
                    <dl className="mt-5 border-t border-ink/10 pt-4">
                      <Row k="Hand in" v={chapter.deliver} />
                      <Row k="Cut" v={`${chapter.from} teams to ${chapter.to}`} />
                    </dl>
                    <p className="label mt-5 rounded-full bg-cream-2 px-4 py-2.5 text-center text-muted">
                      Opens on the day
                    </p>
                  </li>
                ))}
              </ol>
            </Panel>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Panel eyebrow="Hand-ins" title="Your submissions">
              <Empty>
                Nothing to show yet. Chapter I takes an image, a video and a prompt log; Chapter
                II takes a single system prompt, locked once submitted; Chapter III takes a
                prototype and a three minute pitch. Upload opens for each chapter as it starts.
              </Empty>
            </Panel>

            <Panel eyebrow="Before the day" title="Your checklist">
              <ol className="grid gap-3">
                {ENTRY.map((step) => (
                  <li
                    key={step.step}
                    className="flex items-start gap-4 rounded-[var(--r-md)] bg-cream-2 px-5 py-4"
                  >
                    <span className="d-tall shrink-0 text-[1.4rem] leading-none text-teal">
                      {step.step}
                    </span>
                    <span>
                      <span className="label block text-ink">{step.title}</span>
                      <span className="mt-1.5 block text-[0.95rem] text-muted">{step.note}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <p className="serif-it mt-6 text-[0.95rem] leading-relaxed text-muted">
                The full brief, prizes and rules live on the{" "}
                <Link href="/events/attack-on-token" className="text-teal hover:underline">
                  event page
                </Link>
                .
              </p>
            </Panel>
          </div>
        </Container>
      </div>
    </>
  );
}
